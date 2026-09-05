import { router, useLocalSearchParams } from 'expo-router';

import { COOKBOOK_IDS, CookbookScreen, isCookbookId } from '@/liquid-glass';

export function generateStaticParams() {
  return COOKBOOK_IDS.map((cookbook) => ({ cookbook }));
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * `/sky` and `/astro`. Add `?state=open` to land with the sphere already up
 * and the plume out, for screenshots and deterministic checks.
 */
export default function CookbookRoute() {
  const params = useLocalSearchParams<{ cookbook?: string | string[]; state?: string | string[] }>();
  const candidate = first(params.cookbook);
  const name = candidate && isCookbookId(candidate) ? candidate : 'sky';
  const state = first(params.state) === 'open' ? 'open' : 'gate';

  return (
    <CookbookScreen
      initialState={state}
      name={name}
      onActionPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }}
    />
  );
}
