import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Text } from "../text/text";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("preserves a visible line height for nested text", () => {
    render(
      <Tooltip content="More information">
        <Text as="span" size="sm">
          Trigger label
        </Text>
      </Tooltip>,
    );

    const trigger = screen
      .getByText("Trigger label")
      .closest("[data-base-ui-tooltip-trigger]");

    expect(trigger).not.toBeNull();
    expect(trigger?.classList.contains("leading-none")).toBe(true);
    expect(trigger?.classList.contains("leading-[0]")).toBe(false);
  });
});
