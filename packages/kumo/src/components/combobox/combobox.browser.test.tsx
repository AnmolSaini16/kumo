import { beforeAll, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { Combobox } from ".";

const items = ["Apple", "Banana", "Cherry"];

const manyItems = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

describe("Combobox visual regression", () => {
  beforeAll(async () => {
    await document.fonts.ready;
  });

  test("TriggerValue caret is visible", async () => {
    const { getByTestId } = await render(
      <div data-testid="trigger-value-wrapper" style={{ padding: 16 }}>
        <Combobox items={items}>
          <Combobox.TriggerValue>Pick a fruit</Combobox.TriggerValue>
        </Combobox>
      </div>,
    );

    const wrapper = getByTestId("trigger-value-wrapper");
    await expect.element(wrapper).toBeVisible();
    await expect(wrapper).toMatchScreenshot();
  });

  test("TriggerInput caret is visible", async () => {
    const { getByTestId } = await render(
      <div data-testid="trigger-input-wrapper" style={{ padding: 16 }}>
        <Combobox items={items}>
          <Combobox.TriggerInput placeholder="Search fruits…" />
        </Combobox>
      </div>,
    );

    const wrapper = getByTestId("trigger-input-wrapper");
    await expect.element(wrapper).toBeVisible();
    await expect(wrapper).toMatchScreenshot();
  });

  test("dropdown with many items is scrollable", async () => {
    await render(
      <div style={{ padding: 16 }}>
        <Combobox items={manyItems} open>
          <Combobox.TriggerValue>Pick an item</Combobox.TriggerValue>
          <Combobox.Content>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox>
      </div>,
    );

    const listbox = page.getByRole("listbox");
    await expect.element(listbox).toBeVisible();

    // Verify the dropdown is scrollable by checking computed overflow style.
    // The #127 regression changed overflow-y-auto to overflow-hidden,
    // clipping content and preventing users from scrolling to later items.
    const el = listbox.element();
    const overflow = getComputedStyle(el).overflowY;
    expect(
      overflow,
      "listbox should have overflow-y: auto or scroll, not hidden",
    ).toMatch(/auto|scroll/);
  });
});
