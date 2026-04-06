---
"@cloudflare/kumo": patch
---

Fix dropdown scroll behavior for long lists using Base UI ScrollArea

- Compose `ScrollArea` inside `DropdownMenu.Content` for proper scroll handling
- Gradient fade overlays appear at top/bottom edges when content overflows, using ScrollArea's `data-overflow-y-start`/`data-overflow-y-end` attributes
- Custom scrollbar with `bg-kumo-fill` thumb, visible on hover/scroll
- Short menus unaffected: no scrollbar or gradients when content fits
- Fix lint rule false positive for `bg-gradient-to-*` Tailwind utilities
