import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCardGroup } from "./metric-card-group";

describe("MetricCardGroup", () => {
  // Rendering

  it("renders children", () => {
    render(
      <MetricCardGroup>
        <div>Card One</div>
        <div>Card Two</div>
      </MetricCardGroup>,
    );
    expect(screen.getByText("Card One")).toBeTruthy();
    expect(screen.getByText("Card Two")).toBeTruthy();
  });

  it("renders title when provided", () => {
    render(
      <MetricCardGroup title="Performance Metrics">
        <div>Card</div>
      </MetricCardGroup>,
    );
    expect(screen.getByText("Performance Metrics")).toBeTruthy();
  });

  it("renders JSX content as title", () => {
    render(
      <MetricCardGroup
        title={
          <div>
            <span>Custom Title</span>
            <button type="button">Action</button>
          </div>
        }
      >
        <div>Card</div>
      </MetricCardGroup>,
    );
    expect(screen.getByText("Custom Title")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Action" })).toBeTruthy();
  });

  it("does not render title section when title is omitted", () => {
    render(
      <MetricCardGroup>
        <div>Card</div>
      </MetricCardGroup>,
    );
    // LayerCard.Secondary is not rendered, so "Performance Metrics" won't exist
    expect(screen.queryByText("Performance Metrics")).toBeNull();
  });

  // Orientation

  it("applies horizontal layout classes by default", () => {
    const { container } = render(
      <MetricCardGroup>
        <div>Card</div>
      </MetricCardGroup>,
    );
    const innerDiv = container.querySelector(".flex-wrap");
    expect(innerDiv).toBeTruthy();
    expect(innerDiv?.className).toContain("gap-px");
    expect(innerDiv?.className).toContain("bg-kumo-line");
    expect(innerDiv?.className).toContain("overflow-hidden");
    // Consistent card heights when wrapping (matches sparkline card height)
    expect(innerDiv?.className).toContain("[&>*]:min-h-[115px]");
  });

  it("applies vertical layout classes when orientation is vertical", () => {
    const { container } = render(
      <MetricCardGroup orientation="vertical">
        <div>Card</div>
      </MetricCardGroup>,
    );
    const innerDiv = container.querySelector(".divide-y");
    expect(innerDiv).toBeTruthy();
    expect(innerDiv?.className).toContain("flex-col");
  });

  // Props and ref forwarding

  it("forwards className and rest props to the root element", () => {
    const { container } = render(
      <MetricCardGroup className="my-class" data-testid="metric-group">
        <div>Card</div>
      </MetricCardGroup>,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("my-class");
    expect(root?.getAttribute("data-testid")).toBe("metric-group");
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <MetricCardGroup ref={ref}>
        <div>Card</div>
      </MetricCardGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
