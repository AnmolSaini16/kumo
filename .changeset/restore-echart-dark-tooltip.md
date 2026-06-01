---
"@cloudflare/kumo": patch
---

Fix `Chart` (and `SankeyChart`) rendering a white tooltip card in dark mode.
The previous fix for the opaque dark blue canvas removed ECharts' built-in
`"dark"` theme, which also themes the tooltip card, axes, splitLines, and
legend text. The dark theme is now restored when `isDarkMode` is true, and
`backgroundColor: "transparent"` is applied via `setOption` instead of the
init opts so the surrounding `bg-kumo-*` surface still shows through.
