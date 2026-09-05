const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/liquid-glass/orb-field.tsx'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

// Run the actual particle worklet with a deterministic clock and random input.
// Rendering is stubbed; native gesture/rendering checks remain in Maestro.
function createField(returnMode) {
  const boxes = [];
  let onFrame;
  const shared = (value) => ({ value, modify(fn) { this.value = fn(this.value); } });
  const module = { exports: {} };
  const math = Object.create(Math);
  math.random = () => 0.5;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Math: math,
    require(name) {
      if (name === 'react') return { createElement: () => null };
      if (name === '@shopify/react-native-skia') return {};
      if (name === 'react-native-reanimated') return {
        useSharedValue(value) { const box = shared(value); boxes.push(box); return box; },
        useFrameCallback(fn) { onFrame = fn; },
        useDerivedValue(fn) { return { get value() { return fn(); } }; },
      };
      throw new Error(`Unexpected worklet dependency: ${name}`);
    },
  });
  const mode = shared(1);
  module.exports.OrbField({
    width: 402, height: 874, stickers: [], returnMode, mode,
    originX: 201, originY: shared(874 * 0.469),
    touchX: shared(0), touchY: shared(0), touchOn: shared(0),
    windX: shared(0), windY: shared(0), feed: shared(0),
  });
  return {
    mode,
    advance(frames) {
      for (let i = 0; i < frames; i++) onFrame({ timeSincePreviousFrame: 1000 / 60 });
    },
    particles() {
      const state = boxes[0].value;
      const particles = [];
      for (let i = 0; i < module.exports.STICKER_SLOTS; i++) {
        const offset = i * 19;
        if (state[offset + 5] > 0) particles.push({ y: state[offset + 1], opacity: state[offset + 5] });
      }
      return particles;
    },
  };
}

const meanY = (particles) => particles.reduce((sum, p) => sum + p.y, 0) / particles.length;

test('Sky dips, then drifts upward while fading after the dome reaches home', () => {
  const field = createField('fall');
  field.advance(240);
  const open = field.particles();
  assert.equal(open.length, 40);
  field.mode.value = 2;
  field.advance(12);
  assert.ok(meanY(field.particles()) > meanY(open), 'the exit starts with a dip');

  field.mode.value = 0;
  field.advance(30);
  const fading = field.particles();
  assert.equal(fading.length, 40, 'stickers stay on screen during the fade');
  assert.ok(fading.every((p) => p.opacity > 0 && p.opacity < 1));
  field.advance(30);
  const returning = field.particles();
  assert.equal(returning.length, fading.length);
  assert.ok(meanY(returning) < meanY(fading), 'the plume returns upward');
  assert.ok(returning.every((p, i) => p.opacity < fading[i].opacity));
  field.advance(40);
  assert.equal(field.particles().length, 0, 'the fade finishes');

  field.mode.value = 1;
  field.advance(120);
  assert.equal(field.particles().length, 40, 'reopening emits a complete fresh plume');
});

test('Astro keeps its vortex active after the dome reaches home', () => {
  const field = createField('vortex');
  field.advance(240);
  field.mode.value = 2;
  field.advance(12);
  const entering = field.particles();
  field.mode.value = 0;
  field.advance(30);
  const draining = field.particles();
  assert.ok(draining.length > 0);
  assert.ok(meanY(draining) > meanY(entering), 'stickers continue toward the drain');
  assert.ok(draining.every((p) => p.opacity === 1), 'the vortex does not use Sky fading');
  field.advance(30);
  assert.equal(field.particles().length, 0, 'the vortex finishes swallowing every sticker');
});
