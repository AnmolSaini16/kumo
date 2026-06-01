---
"@cloudflare/kumo": patch
---

Fix `Chart` rendering an opaque dark blue background in dark mode. Previously
`isDarkMode` selected ECharts' built-in `"dark"` theme, which paints the canvas
with its own dark `backgroundColor` and clashes with kumo's surface tokens. The
chart now initialises with a transparent background in both modes so the
surrounding `bg-kumo-*` surface shows through symmetrically.
