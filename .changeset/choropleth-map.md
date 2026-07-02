---
"@cloudflare/kumo": major
---

Add `ChoroplethMap`, a GeoJSON region choropleth chart component that joins data rows to features by `name`/`nameProperty` and shades regions with a continuous `visualMap` scale. Includes Kumo light/dark map colours, tooltip formatting, optional legend, hover/click callbacks, roam controls, docs, and demos.

Both `BubbleMap` and `ChoroplethMap` now apply a d3-geo `projection` (latitude-clamped Mercator by default; pass another d3-geo projection or `null` for raw plotting) and size by `aspectRatio` so the map fills its container without letterboxing. The container height now derives from the projected window's aspect ratio by default; pass an explicit `height` to opt back into a fixed pixel height.

Update `BubbleMap` viewport behavior to avoid resetting user pan and zoom while refreshing bubble data.

Breaking interaction change: `BubbleMap` now defaults `roam` to `false`, so maps no longer allow drag-to-pan or scroll-to-zoom unless consumers pass `roam={true}`.
