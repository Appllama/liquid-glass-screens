# URI decoder compatibility

Expo Router 57 uses query-string 7, which expects its URI decoder to export a
CommonJS function. The patched decode-uri-component 0.5.0 release exports an ES
module default instead. This adapter exposes that same upstream function in the
format query-string expects; it does not implement or copy the decoding algorithm.

The upstream package is installed under the alias `upstream-decoder` so the
root override does not recursively replace the adapter's own dependency.
Node 22.13+ supports this import, and Metro resolves it for the native app.

The override addresses [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr).
Keep the compatibility tests and native deep-link checks when changing it.
Remove the adapter and its root dependency/override together once Expo Router
uses a compatible patched parser.
