# Dependency maintenance

The gallery keeps Expo SDK 57, React Native 0.86.3, React 19.2.3, and the existing
Skia/Reanimated versions. React DOM is explicitly pinned to React's version so
fresh installs cannot select an incompatible peer dependency.

Two root-level overrides address upstream security advisories:

- **URI decoding:** Expo Router uses query-string 7's CommonJS API. Its decoder
  is replaced by the local compatibility package in
  [`packages/decode-uri-component-compat`](../packages/decode-uri-component-compat).
  The adapter exposes the unchanged upstream function from decode-uri-component
  0.5.0, which fixes
  [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
  It keeps the router's parser version and public API in place.
- **Xcode tooling:** xcode 3.0.1 uses only `uuid.v4()` without an output buffer.
  The scoped override selects uuid 11.1.1, which retains that CommonJS API and
  fixes [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

The decoder is declared in devDependencies to make the root override resolvable
without imposing a local file dependency on consumers of the source package.
It is also a transitive runtime requirement through query-string in this gallery.
The upstream decoder uses an npm alias to avoid recursively applying the override
to the adapter itself.

The dependency tests exercise the router's actual parser with screen state,
Unicode, duplicate keys, empty values, serialization, and bounded malformed-input
handling. They also check Xcode identifier generation and the UUID buffer fix.
Run:

```sh
npm ci
npm run verify
npm audit --audit-level=moderate
```

For changes to these overrides, also check iOS bundling and the Sky, Astro, and
navigation Maestro flows in a running native build. Compare the existing motion
and artwork before and after the change.

Remove an override and its adapter/tests only when the upstream dependency chain
provides a compatible patched release. npm applies overrides from the root
project: apps consuming this repository as a dependency must review their own
dependency tree and SDK compatibility separately.
