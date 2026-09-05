import type { CookbookTheme } from '../types';

/**
 * Cookbook 2 — Astro. A night page: a still starfield in two layers (the
 * stars, and a horizon glow added as light that dissipates through the glass
 * as the sphere rises), a chrome-balloon wordmark, app-building stickers, and
 * a blue-white glass. When the sphere is sent back down the plume is drawn
 * into the bottom centre in a spiral, shedding stardust.
 */

const stickers = {
  mac: require('../../../assets/cookbooks/astro/stickers/mac.png'),
  bubbleBuild: require('../../../assets/cookbooks/astro/stickers/bubble-build.png'),
  keyboard: require('../../../assets/cookbooks/astro/stickers/keyboard.png'),
  phone: require('../../../assets/cookbooks/astro/stickers/phone.png'),
  robot: require('../../../assets/cookbooks/astro/stickers/robot.png'),
  cursor: require('../../../assets/cookbooks/astro/stickers/cursor.png'),
  star: require('../../../assets/cookbooks/astro/stickers/star.png'),
  code: require('../../../assets/cookbooks/astro/stickers/code.png'),
  rocket: require('../../../assets/cookbooks/astro/stickers/rocket.png'),
  planet: require('../../../assets/cookbooks/astro/stickers/planet.png'),
  bubbleReel: require('../../../assets/cookbooks/astro/stickers/bubble-reel.png'),
  bolt: require('../../../assets/cookbooks/astro/stickers/bolt.png'),
  sparkle: require('../../../assets/cookbooks/astro/stickers/sparkle.png'),
  wand: require('../../../assets/cookbooks/astro/stickers/wand.png'),
  puzzle: require('../../../assets/cookbooks/astro/stickers/puzzle.png'),
  bubbleShip: require('../../../assets/cookbooks/astro/stickers/bubble-ship.png'),
  floppy: require('../../../assets/cookbooks/astro/stickers/floppy.png'),
  astronaut: require('../../../assets/cookbooks/astro/stickers/astronaut.png'),
  mascot: require('../../../assets/cookbooks/astro/stickers/mascot.png'),
  paperPlane: require('../../../assets/cookbooks/astro/stickers/paper-plane.png'),
  bubbleDarkMode: require('../../../assets/cookbooks/astro/stickers/bubble-dark-mode.png'),
  bulb: require('../../../assets/cookbooks/astro/stickers/bulb.png'),
  controller: require('../../../assets/cookbooks/astro/stickers/controller.png'),
  bubbleVibe: require('../../../assets/cookbooks/astro/stickers/bubble-vibe.png'),
} as const;

export const ASTRO_ASSET_MODULES = [
  require('../../../assets/cookbooks/astro/stars.png'),
  require('../../../assets/cookbooks/astro/glow.png'),
  require('../../../assets/cookbooks/astro/wordmark.png'),
  ...Object.values(stickers),
] as const;

const s = stickers;

export const ASTRO_THEME: CookbookTheme = {
  id: 'astro',
  background: {
    kind: 'layers',
    base: require('../../../assets/cookbooks/astro/stars.png'),
    glow: require('../../../assets/cookbooks/astro/glow.png'),
  },
  wordmark: require('../../../assets/cookbooks/astro/wordmark.png'),
  // forty slots, in plume order; the big hero stickers lead
  stickers: [
    s.mac, s.bubbleBuild, s.keyboard, s.phone, s.robot,
    s.cursor, s.star, s.code, s.rocket, s.planet,
    s.bubbleReel, s.bolt, s.sparkle, s.wand, s.puzzle,
    s.bubbleShip, s.floppy, s.astronaut, s.mascot, s.paperPlane,
    s.bubbleDarkMode, s.bulb, s.controller, s.cursor,
    s.robot, s.code, s.floppy, s.star,
    s.phone, s.rocket, s.sparkle, s.mac,
    s.bolt, s.planet, s.paperPlane, s.wand,
    s.bubbleVibe, s.puzzle, s.mascot, s.astronaut,
  ],
  returnMode: 'vortex',
  // the moment the open state is let go, the plume is taken back down
  releaseAt: 0.78,
  night: 1,
  // pinpoint stars split into three coloured dots at the dome's size, which
  // reads as noise, so the great dome gets no fringe at all
  lens: { buttonDispersion: 0.12, domeDispersion: 0, domeAt: 0.6 },
  colors: {
    page: '#04060C',
    ink: '#F4F6FC',
    hint: 'rgba(226,232,246,0.78)',
    plus: '#F4F6FC',
    pillFrom: '#3A3F4D',
    pillTo: '#F4F6FC',
    pillText: '#0A0C14',
  },
  blurTint: 'dark',
  statusBar: 'light',
  copy: {
    hint: 'Swipe up to enter',
    headline: 'Create and launch',
    struck: 'code',
    kept: 'apps',
    phrases: ['from one message', 'you saw on a reel', 'without a line of code', 'before your coffee cools'],
    cta: 'Let’s go',
  },
};
