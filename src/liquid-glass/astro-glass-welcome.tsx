import { ASTRO_THEME } from './cookbooks/astro';
import { LiquidGlassScreen } from './liquid-glass-screen';
import type { LiquidGlassScreenProps } from './types';

/** Cookbook 2 — the night sky page. */
export function AstroGlassWelcome(props: LiquidGlassScreenProps) {
  return <LiquidGlassScreen theme={ASTRO_THEME} {...props} />;
}
