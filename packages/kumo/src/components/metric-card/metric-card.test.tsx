import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricCard } from "./metric-card";

const CustomIcon = ({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    data-testid="custom-icon"
    width={size}
    height={size}
    className={className}
  />
);

describe("MetricCard", () => {
  // Rendering

  it("renders label, value, and unit", () => {
    render(<MetricCard label="Error Rate" value="0.3" unit="%" />);
    expect(screen.getByText("Error Rate")).toBeTruthy();
    expect(screen.getByText("0.3")).toBeTruthy();
    expect(screen.getByText("%")).toBeTruthy();
  });

  it("renders as a div by default", () => {
    const { container } = render(<MetricCard label="Requests" value="1.2M" />);
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("applies variant color to the value", () => {
    const { container } = render(
      <MetricCard label="Errors" value="42" variant="danger" />,
    );
    const valueSpan = container.querySelector(".text-kumo-danger");
    expect(valueSpan).toBeTruthy();
  });

  // Polymorphic element

  it("renders as an anchor when href is provided", () => {
    const { container } = render(
      <MetricCard label="Requests" value="1.2M" href="/metrics" />,
    );
    const root = container.firstElementChild;
    expect(root?.tagName).toBe("A");
    expect(root?.getAttribute("href")).toBe("/metrics");
  });

  it("renders as a button when onClick is provided and fires the handler", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const { container } = render(
      <MetricCard label="Requests" value="1.2M" onClick={handleClick} />,
    );
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as an anchor when both href and onClick are provided", () => {
    const { container } = render(
      <MetricCard
        label="Requests"
        value="1.2M"
        href="/metrics"
        onClick={() => {}}
      />,
    );
    expect(container.firstElementChild?.tagName).toBe("A");
  });

  // Trend indicator

  it("renders trend label with correct color for positive and negative", () => {
    const { container: positive } = render(
      <MetricCard
        label="Traffic"
        value="1.2M"
        trend={{ direction: "up", label: "13.8%", isPositive: true }}
      />,
    );
    expect(screen.getByText("13.8%")).toBeTruthy();
    expect(positive.querySelector(".text-kumo-success")).toBeTruthy();

    const { container: negative } = render(
      <MetricCard
        label="Errors"
        value="842"
        trend={{ direction: "up", label: "5%", isPositive: false }}
      />,
    );
    expect(negative.querySelector(".text-kumo-danger")).toBeTruthy();
  });

  it("renders neutral trend without color emphasis", () => {
    const { container } = render(
      <MetricCard
        label="Stable"
        value="99.9"
        trend={{ direction: "neutral", label: "0%", isPositive: true }}
      />,
    );
    expect(screen.getByText("0%")).toBeTruthy();
    expect(container.querySelector(".text-kumo-subtle")).toBeTruthy();
  });

  // Sparkline

  it("renders sparkline SVG when data is provided", () => {
    const { container } = render(
      <MetricCard
        label="Requests"
        value="1.2M"
        sparkline={{ data: [10, 20, 30, 40, 50] }}
      />,
    );
    expect(container.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  });

  it("does not render sparkline when data is empty", () => {
    const { container } = render(
      <MetricCard label="Requests" value="1.2M" sparkline={{ data: [] }} />,
    );
    expect(container.querySelectorAll("svg").length).toBe(0);
  });

  // Loading state

  it("shows label and hides value, trend, and sparkline when loading", () => {
    const { container } = render(
      <MetricCard
        label="Requests"
        value="1.2M"
        loading
        trend={{ direction: "up", label: "13.8%", isPositive: true }}
        sparkline={{ data: [10, 20, 30] }}
      />,
    );
    expect(screen.getByText("Requests")).toBeTruthy();
    expect(screen.queryByText("1.2M")).toBeNull();
    expect(screen.queryByText("13.8%")).toBeNull();
    expect(container.querySelector("svg[aria-hidden='true']")).toBeNull();
  });

  // Error state

  it("shows em-dash and hides unit, trend, and sparkline when error", () => {
    const { container } = render(
      <MetricCard
        label="Rate"
        value="0.3"
        unit="%"
        error
        trend={{ direction: "up", label: "13.8%", isPositive: true }}
        sparkline={{ data: [10, 20, 30] }}
      />,
    );
    expect(screen.getByText("Rate")).toBeTruthy();
    expect(screen.queryByText("0.3")).toBeNull();
    expect(screen.queryByText("%")).toBeNull();
    expect(screen.getByText("\u2014")).toBeTruthy();
    expect(screen.queryByText("13.8%")).toBeNull();
    expect(container.querySelector("svg[aria-hidden='true']")).toBeNull();
  });

  // Tooltip

  it("renders an accessible tooltip button when tooltip is provided", () => {
    render(
      <MetricCard
        label="Requests"
        value="1.2M"
        tooltip="Total HTTP requests"
      />,
    );
    expect(
      screen.getByRole("button", { name: "More information" }),
    ).toBeTruthy();
  });

  it("renders a custom tooltip icon that inherits the label color", () => {
    const { container } = render(
      <MetricCard
        label="Requests"
        value="1.2M"
        tooltip="Help text"
        tooltipIcon={CustomIcon}
      />,
    );
    expect(container.querySelector('[data-testid="custom-icon"]')).toBeTruthy();
    // The trigger button carries text-kumo-subtle so icons inherit via currentColor
    const triggerButton = screen.getByRole("button", {
      name: "More information",
    });
    expect(triggerButton.className).toContain("text-kumo-subtle");
  });

  // Props and ref forwarding

  it("forwards className and rest props to the root element", () => {
    const { container } = render(
      <MetricCard
        label="Test"
        value="42"
        className="my-class"
        data-testid="my-metric"
      />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("my-class");
    expect(root?.getAttribute("data-testid")).toBe("my-metric");
  });

  it("forwards ref to the root element", () => {
    const ref = vi.fn();
    render(<MetricCard ref={ref} label="Requests" value="1.2M" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
});
