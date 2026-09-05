import { ASTRO_ASSET_MODULES } from './cookbooks/astro';
import { SKY_ASSET_MODULES } from './cookbooks/sky';

/**
 * Metro module IDs for every local bitmap and clip used by the two cookbooks.
 * Loading these before the router mounts keeps a first-use decode from
 * showing up as a late sticker or a blank sky on cold launches.
 */
export const LIQUID_GLASS_ASSET_MODULES = [
  ...SKY_ASSET_MODULES,
  ...ASTRO_ASSET_MODULES,
] as const;
