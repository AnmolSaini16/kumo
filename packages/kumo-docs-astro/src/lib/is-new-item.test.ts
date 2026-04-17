import { describe, it, expect } from "vitest";
import { isNewItem, type NewItems } from "./is-new-item";

describe("isNewItem", () => {
  it("returns true for a new component", () => {
    const newItems: NewItems = {
      components: { sidebar: "2026-04-01T00:00:00Z" },
      blocks: {},
      charts: {},
    };
    expect(isNewItem("/components/sidebar", newItems)).toBe(true);
  });

  it("returns false for a component not in the map", () => {
    const newItems: NewItems = { components: {}, blocks: {}, charts: {} };
    expect(isNewItem("/components/badge", newItems)).toBe(false);
  });

  it("returns true for a new block", () => {
    const newItems: NewItems = {
      components: {},
      blocks: { "page-header": "2026-04-01T00:00:00Z" },
      charts: {},
    };
    expect(isNewItem("/blocks/page-header", newItems)).toBe(true);
  });

  it("flags only the chart pages that are individually new", () => {
    const newItems: NewItems = {
      components: {},
      blocks: {},
      charts: { timeseries: "2026-04-01T00:00:00Z" },
    };
    expect(isNewItem("/charts/timeseries", newItems)).toBe(true);
    expect(isNewItem("/charts/custom", newItems)).toBe(false);
    expect(isNewItem("/charts", newItems)).toBe(false);
  });

  it("maps /charts (no slug) to the index key", () => {
    const newItems: NewItems = {
      components: {},
      blocks: {},
      charts: { index: "2026-04-01T00:00:00Z" },
    };
    expect(isNewItem("/charts", newItems)).toBe(true);
    expect(isNewItem("/charts/timeseries", newItems)).toBe(false);
  });

  it("returns false for static pages", () => {
    const newItems: NewItems = { components: {}, blocks: {}, charts: {} };
    expect(isNewItem("/getting-started", newItems)).toBe(false);
    expect(isNewItem("/", newItems)).toBe(false);
    expect(isNewItem("/installation", newItems)).toBe(false);
  });

  it("returns false when newItems is undefined", () => {
    expect(isNewItem("/components/sidebar", undefined)).toBe(false);
    expect(isNewItem("/blocks/page-header", undefined)).toBe(false);
    expect(isNewItem("/charts/timeseries", undefined)).toBe(false);
  });

  it("returns false for hrefs without a slug segment", () => {
    const newItems: NewItems = {
      components: { sidebar: "2026-04-01T00:00:00Z" },
      blocks: {},
      charts: {},
    };
    expect(isNewItem("/components", newItems)).toBe(false);
    expect(isNewItem("/blocks", newItems)).toBe(false);
  });
});
