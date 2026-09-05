export const COOKBOOK_IDS = ['sky', 'astro'] as const;

export type CookbookId = (typeof COOKBOOK_IDS)[number];

export type LiquidGlassActionId = 'sky.lets-go' | 'astro.lets-go';

export type LiquidGlassActionPressHandler = (actionId: LiquidGlassActionId) => void;

/** How the stickers leave when the sphere is sent back down. */
export type ReturnMode =
  /** They dip, then float back up while fading when the dome reaches home. */
  | 'fall'
  /** They are drawn into the bottom centre in a tightening spiral, shedding stardust. */
  | 'vortex';

export type CookbookBackground =
  /** A looping, muted video drawn inside the canvas so the lens bends it. `poster` is its first frame. */
  | { kind: 'video'; source: number; poster: number }
  /** A still in two layers: the base, and a glow added as light that dissipates through the glass as the sphere rises. */
  | { kind: 'layers'; base: number; glow: number };

export type CookbookTheme = {
  id: CookbookId;
  background: CookbookBackground;
  /** The chrome-balloon wordmark shown at the gate, a square image. */
  wordmark: number;
  /** Exactly forty sticker modules, in plume order. Sizes are authored per slot in `orb-field.tsx`. */
  stickers: readonly number[];
  returnMode: ReturnMode;
  /** Where on the way down the plume is released: 0..1 of the sphere's travel. */
  releaseAt: number;
  /** 0 = daylight glass tuning, 1 = night tuning. */
  night: 0 | 1;
  /** Per-channel dispersion of the lens at button size and at dome size, and how far up the size ramp the dome value is reached (1 = at full dome). */
  lens: { buttonDispersion: number; domeDispersion: number; domeAt: number };
  colors: {
    page: string;
    ink: string;
    hint: string;
    plus: string;
    pillFrom: string;
    pillTo: string;
    pillText: string;
  };
  blurTint: 'light' | 'dark';
  statusBar: 'light' | 'dark';
  copy: {
    hint: string;
    headline: string;
    struck: string;
    kept: string;
    phrases: readonly string[];
    cta: string;
  };
};

export type LiquidGlassScreenProps = {
  /** `'gate'` (default) starts closed, with the dome on the bottom edge; `'open'` starts with the sphere already up and the plume out. */
  initialState?: 'gate' | 'open';
  onActionPress?: LiquidGlassActionPressHandler;
  /** Backward-compatible handler for the primary action. `onActionPress` takes precedence. */
  onPrimaryPress?: () => void;
};

export type CookbookMetadata = {
  id: CookbookId;
  number: 1 | 2;
  displayName: string;
  background: CookbookBackground['kind'];
  returnMode: ReturnMode;
};
