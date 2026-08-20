---
"@cloudflare/kumo": patch
---

Normalize shadows and outlines on tip-style overlays (Popover, Tooltip, ClipboardText, Chart tooltip).

- Drop the `shadow-kumo-tip-shadow` color override so shadows use Tailwind's default translucent black instead of an opaque light-gray in light mode.
- Tune shadow sizes: Popover, Tooltip, ClipboardText tooltip, and Chart tooltip use `shadow-md`; ClipboardText's "Copied" toast keeps `shadow-lg` to match the Toast component.
- Switch these overlays from `outline-kumo-fill` to `outline-kumo-line`, matching every other floating surface (Dropdown, Select, Combobox, Dialog, etc.).
- Rename `kumo-tip-shadow` → `kumo-arrow-edge` and `kumo-tip-stroke` → `kumo-arrow-stroke`. The tokens draw the border on Popover/Tooltip arrow SVGs, not a box shadow. Both now resolve to `kumo-line`, so the arrow border aligns with the popup outline in both modes.
