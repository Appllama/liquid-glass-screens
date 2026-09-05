import type { CookbookMetadata } from './types';

export const COOKBOOK_METADATA: readonly CookbookMetadata[] = [
  {
    id: 'sky',
    number: 1,
    displayName: 'Sky',
    background: 'video',
    returnMode: 'fall',
  },
  {
    id: 'astro',
    number: 2,
    displayName: 'Astro',
    background: 'layers',
    returnMode: 'vortex',
  },
] as const;
