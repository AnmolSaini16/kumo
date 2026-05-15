---
"@cloudflare/kumo": patch
---

fix(banner): remove variant selection background for legibility

Selected text inside `Banner` now uses the browser default selection color
instead of a same-hue variant-tinted background. The previous
`selection:bg-kumo-{info,warning,danger}` utilities produced low contrast
between the selection background and the variant text color (most notably
in light mode for the `error` and `alert` variants), making selected text
hard to read.
