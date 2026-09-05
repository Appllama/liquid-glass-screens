#!/bin/zsh
# Record the iOS simulator as a most-compatible MP4: H.264 High, yuv420p,
# constant 60 fps, faststart. The simulator captures at a variable rate (up to
# 120 fps on ProMotion devices) into a .mov, so the capture is transcoded.
#
#   scripts/simrec.sh out.mp4                       # record until Enter
#   scripts/simrec.sh out.mp4 -- <command...>       # record while a command runs
#   UDID=<device udid> scripts/simrec.sh out.mp4 -- maestro --device <udid> test scripts/maestro/astro.yaml
set -u
UDID=${UDID:-booted}
out=$1; shift
tmp=$(mktemp -t simrec).mov
xcrun simctl io "$UDID" recordVideo --codec h264 --force -f "$tmp" >/dev/null 2>&1 &
rec=$!
sleep 1.5
command_status=0
if [ "${1:-}" = "--" ]; then
  shift; "$@" || command_status=$?
  sleep 1
else
  echo "recording… press Enter to stop"; read -r _
fi
kill -INT $rec; wait $rec 2>/dev/null; sleep 1
ffmpeg -v error -y -i "$tmp" -vf "fps=60,scale=trunc(iw/2)*2:trunc(ih/2)*2" -r 60 -fps_mode cfr \
  -c:v libx264 -profile:v high -level 4.2 -preset medium -crf 18 -pix_fmt yuv420p \
  -movflags +faststart -an "$out" && rm -f "$tmp" || exit 1
ffprobe -v error -select_streams v -show_entries stream=codec_name,profile,avg_frame_rate,width,height -of default=nw=1 "$out" || exit $?
exit "$command_status"
