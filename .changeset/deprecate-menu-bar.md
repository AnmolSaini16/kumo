---
"@cloudflare/kumo": patch
---

deprecate `MenuBar` in favor of segmented `Tabs`

- mark the `MenuBar` component (and its exports) as `@deprecated`; it will be removed in a future release
- new usage should prefer `Tabs` with `variant="segmented"` (the default `Tabs` variant)
- the runtime behaviour of `MenuBar` is unchanged for existing consumers
- remove the `MenuBar` documentation page and demos from the docs site
