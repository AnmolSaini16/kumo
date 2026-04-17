import type { NewItems } from "./component-birth-dates";

// Determines whether a sidebar href points at a recently added component, block, or chart page.
export function isNewItem(
  href: string,
  newItems: NewItems | undefined,
): boolean {
  const [section, slug] = href.split("/").filter(Boolean);

  if (section === "components") {
    return Boolean(newItems?.components?.[slug]);
  }

  if (section === "blocks") {
    return Boolean(newItems?.blocks?.[slug]);
  }

  if (section === "charts") {
    const key = slug ?? "index";

    return Boolean(newItems?.charts?.[key]);
  }

  return false;
}

export type { NewItems };
