import { ASTRO_THEME } from './cookbooks/astro';
import { SKY_THEME } from './cookbooks/sky';
import { LiquidGlassScreen } from './liquid-glass-screen';
import type { CookbookId, CookbookTheme, LiquidGlassScreenProps } from './types';

const THEMES: Record<CookbookId, CookbookTheme> = {
  sky: SKY_THEME,
  astro: ASTRO_THEME,
};

export type CookbookScreenProps = LiquidGlassScreenProps & { name: CookbookId };

/** Select a cookbook by its typed ID. */
export function CookbookScreen({ name, ...props }: CookbookScreenProps) {
  return <LiquidGlassScreen theme={THEMES[name]} {...props} />;
}
