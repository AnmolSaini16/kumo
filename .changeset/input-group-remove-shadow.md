---
"@cloudflare/kumo": patch
---

Remove the subtle `shadow-xs` drop shadow from `InputGroup` `Root` and from nested `InputGroup.Button`, so the component matches the flat appearance of the standalone `Input` and other form controls (previously non-ghost button variants still had the base Button's `shadow-xs`).
