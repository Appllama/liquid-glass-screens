import { SKY_THEME } from './cookbooks/sky';
import { LiquidGlassScreen } from './liquid-glass-screen';
import type { LiquidGlassScreenProps } from './types';

/** Cookbook 1 — the daylight sky page. */
export function SkyGlassWelcome(props: LiquidGlassScreenProps) {
  return <LiquidGlassScreen theme={SKY_THEME} {...props} />;
}
