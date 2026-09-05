import { COOKBOOK_IDS, type CookbookId } from './types';

export { AstroGlassWelcome } from './astro-glass-welcome';
export { LIQUID_GLASS_ASSET_MODULES } from './assets';
export { ASTRO_ASSET_MODULES, ASTRO_THEME } from './cookbooks/astro';
export { SKY_ASSET_MODULES, SKY_THEME } from './cookbooks/sky';
export { CookbookScreen, type CookbookScreenProps } from './cookbook-screen';
export { LiquidGlassScreen } from './liquid-glass-screen';
export { STICKER_SIZES, STICKER_SLOTS } from './orb-field';
export { COOKBOOK_METADATA } from './registry';
export { SkyGlassWelcome } from './sky-glass-welcome';
export { COOKBOOK_IDS } from './types';
export type {
  CookbookBackground,
  CookbookId,
  CookbookMetadata,
  CookbookTheme,
  LiquidGlassActionId,
  LiquidGlassActionPressHandler,
  LiquidGlassScreenProps,
  ReturnMode,
} from './types';

export function isCookbookId(value: string): value is CookbookId {
  return (COOKBOOK_IDS as readonly string[]).includes(value);
}
