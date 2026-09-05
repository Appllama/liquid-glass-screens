import type { CookbookTheme } from '../types';

/**
 * Cookbook 1 — Sky. A daylight page: a looping cloud video, a chrome-balloon
 * wordmark, travel stickers, and a grey-shaded glass. When the sphere is sent
 * back down the plume dips, then floats back up while fading as the dome lands.
 */

const stickers = {
  pizza: require('../../../assets/cookbooks/sky/stickers/pizza.png'),
  dog: require('../../../assets/cookbooks/sky/stickers/dog.png'),
  boots: require('../../../assets/cookbooks/sky/stickers/boots.png'),
  polaroid: require('../../../assets/cookbooks/sky/stickers/polaroid.png'),
  camcorder: require('../../../assets/cookbooks/sky/stickers/camcorder.png'),
  disco: require('../../../assets/cookbooks/sky/stickers/disco.png'),
  star: require('../../../assets/cookbooks/sky/stickers/star.png'),
  sushi: require('../../../assets/cookbooks/sky/stickers/sushi.png'),
  coffee: require('../../../assets/cookbooks/sky/stickers/coffee.png'),
  martini: require('../../../assets/cookbooks/sky/stickers/martini.png'),
  bubbleReel: require('../../../assets/cookbooks/sky/stickers/bubble-reel.png'),
  cake: require('../../../assets/cookbooks/sky/stickers/cake.png'),
  bag: require('../../../assets/cookbooks/sky/stickers/bag.png'),
  croissant: require('../../../assets/cookbooks/sky/stickers/croissant.png'),
  tennis: require('../../../assets/cookbooks/sky/stickers/tennis.png'),
  bubbleHype: require('../../../assets/cookbooks/sky/stickers/bubble-hype.png'),
  reel: require('../../../assets/cookbooks/sky/stickers/reel.png'),
  suitcase: require('../../../assets/cookbooks/sky/stickers/suitcase.png'),
  mascot: require('../../../assets/cookbooks/sky/stickers/mascot.png'),
  frame: require('../../../assets/cookbooks/sky/stickers/frame.png'),
  bubbleTrap: require('../../../assets/cookbooks/sky/stickers/bubble-trap.png'),
  pin: require('../../../assets/cookbooks/sky/stickers/pin.png'),
} as const;

export const SKY_ASSET_MODULES = [
  require('../../../assets/cookbooks/sky/sky.mp4'),
  require('../../../assets/cookbooks/sky/sky-poster.png'),
  require('../../../assets/cookbooks/sky/wordmark.png'),
  ...Object.values(stickers),
] as const;

const s = stickers;

export const SKY_THEME: CookbookTheme = {
  id: 'sky',
  background: {
    kind: 'video',
    source: require('../../../assets/cookbooks/sky/sky.mp4'),
    poster: require('../../../assets/cookbooks/sky/sky-poster.png'),
  },
  wordmark: require('../../../assets/cookbooks/sky/wordmark.png'),
  // forty slots, in plume order; the big hero stickers lead
  stickers: [
    s.pizza, s.dog, s.boots, s.polaroid, s.camcorder,
    s.disco, s.star, s.sushi, s.coffee, s.martini,
    s.bubbleReel, s.cake, s.bag, s.croissant, s.tennis,
    s.bubbleHype, s.reel, s.suitcase, s.mascot, s.frame,
    s.bubbleTrap, s.pin, s.polaroid, s.martini,
    s.dog, s.coffee, s.boots, s.star,
    s.camcorder, s.sushi, s.croissant, s.pizza,
    s.cake, s.disco, s.frame, s.bag,
    s.bubbleReel, s.tennis, s.mascot, s.suitcase,
  ],
  returnMode: 'fall',
  releaseAt: 0.35,
  night: 0,
  lens: { buttonDispersion: 0.12, domeDispersion: 0.05, domeAt: 1 },
  colors: {
    page: '#DCE8F2',
    ink: '#1D1D1F',
    hint: '#38383C',
    plus: '#1D1D1F',
    pillFrom: '#B9B9B9',
    pillTo: '#161616',
    pillText: '#FFFFFF',
  },
  blurTint: 'light',
  statusBar: 'dark',
  copy: {
    hint: 'Swipe up to enter',
    headline: 'Create and discover',
    struck: 'screenshots',
    kept: 'spots',
    phrases: ['to save your memories', 'to plan your next trip', 'to relive your travels', 'to come back to later'],
    cta: 'Let’s go',
  },
};
