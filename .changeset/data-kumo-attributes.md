---
"@cloudflare/kumo": minor
---

Add `data-kumo` attributes to component root elements for targeted CSS resets

This enables consuming applications (like Stratus) to write targeted CSS resets that protect Kumo components from conflicting global styles. For example:

```css
/* Reset button backgrounds that global styles may have polluted */
[data-kumo="button"] {
  background: revert;
}

/* Reset label margins that global styles may have added */
[data-kumo="field"] label {
  margin: 0;
}
```

**Components with `data-kumo` attributes:**

| Component   | Attributes                                                                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Badge       | `data-kumo="badge"`                                                                                                                                                                                                            |
| Button      | `data-kumo="button"`, `data-kumo="link-button"`                                                                                                                                                                                |
| Checkbox    | `data-kumo="checkbox"`, `data-kumo="checkbox-group"`                                                                                                                                                                           |
| Collapsible | `data-kumo="collapsible"`, `data-kumo="collapsible-trigger"`, `data-kumo="collapsible-content"`                                                                                                                                |
| Combobox    | `data-kumo="combobox"`, `data-kumo="combobox-item"`                                                                                                                                                                            |
| Dialog      | `data-kumo="dialog"`, `data-kumo="dialog-title"`, `data-kumo="dialog-description"`                                                                                                                                             |
| Dropdown    | `data-kumo="dropdown"`, `data-kumo="dropdown-item"`, `data-kumo="dropdown-link-item"`, `data-kumo="dropdown-checkbox-item"`, `data-kumo="dropdown-radio-item"`, `data-kumo="dropdown-label"`, `data-kumo="dropdown-separator"` |
| Field       | `data-kumo="field"`                                                                                                                                                                                                            |
| Input       | `data-kumo="input"`                                                                                                                                                                                                            |
| Label       | `data-kumo="label"`                                                                                                                                                                                                            |
| Link        | `data-kumo="link"`                                                                                                                                                                                                             |
| MenuBar     | `data-kumo="menubar"`, `data-kumo="menubar-option"`                                                                                                                                                                            |
| Popover     | `data-kumo="popover"`, `data-kumo="popover-title"`, `data-kumo="popover-description"`                                                                                                                                          |
| Radio       | `data-kumo="radio"`, `data-kumo="radio-group"`                                                                                                                                                                                 |
| Select      | `data-kumo="select"`                                                                                                                                                                                                           |
| Switch      | `data-kumo="switch"`, `data-kumo="switch-group"`                                                                                                                                                                               |
| Tabs        | `data-kumo="tabs"`, `data-kumo="tabs-list"`, `data-kumo="tabs-tab"`                                                                                                                                                            |
| Tooltip     | `data-kumo="tooltip"`                                                                                                                                                                                                          |
