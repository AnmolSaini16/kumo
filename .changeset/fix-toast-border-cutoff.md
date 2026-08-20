---
"@cloudflare/kumo": patch
---

Fix Toast background clipping the ring outline at the corners — the inner background layer's radius (11px) was smaller than the root's `rounded-xl` (12px), painting over the ring at the corners. Matched them up.
