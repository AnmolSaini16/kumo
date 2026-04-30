import { forwardRef, type ReactNode } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { LayerCard } from "../layer-card/layer-card";

// Variants (lint-enforced exports)

/** MetricCardGroup variant definitions mapping orientation to layout classes. */
export const KUMO_METRIC_CARD_GROUP_VARIANTS = {
  orientation: {
    horizontal: {
      classes:
        "flex flex-wrap gap-px overflow-hidden bg-kumo-line [&>*]:min-w-[170px] [&>*]:min-h-[115px] [&>*]:basis-[170px] [&>*]:grow",
      description:
        "Responsive row of cards with gap dividers, wrapping into rows",
    },
    vertical: {
      classes: "flex flex-col divide-y divide-kumo-line",
      description: "Cards stacked with horizontal dividers",
    },
  },
} as const;

export const KUMO_METRIC_CARD_GROUP_DEFAULT_VARIANTS = {
  orientation: "horizontal",
} as const;

// Derived types from KUMO_METRIC_CARD_GROUP_VARIANTS
export type KumoMetricCardGroupOrientation =
  keyof typeof KUMO_METRIC_CARD_GROUP_VARIANTS.orientation;

export interface KumoMetricCardGroupVariantsProps {
  /**
   * Layout direction for child metric cards.
   * - `"horizontal"` — Cards in a row with vertical dividers
   * - `"vertical"` — Cards stacked with horizontal dividers
   * @default "horizontal"
   */
  orientation?: KumoMetricCardGroupOrientation;
}

export function metricCardGroupVariants({
  orientation = KUMO_METRIC_CARD_GROUP_DEFAULT_VARIANTS.orientation,
}: KumoMetricCardGroupVariantsProps = {}) {
  const orientationConfig =
    KUMO_METRIC_CARD_GROUP_VARIANTS.orientation[orientation];
  return cn(
    orientationConfig?.classes ??
      KUMO_METRIC_CARD_GROUP_VARIANTS.orientation[
        KUMO_METRIC_CARD_GROUP_DEFAULT_VARIANTS.orientation
      ].classes,
  );
}

// MetricCardGroup

/**
 * MetricCardGroup component props.
 *
 * @example
 * ```tsx
 * <MetricCardGroup>
 *   <MetricCard label="Requests" value="1.2M" />
 *   <MetricCard label="Error Rate" value="0.3" unit="%" />
 * </MetricCardGroup>
 *
 * <MetricCardGroup title="Performance" orientation="vertical">
 *   <MetricCard label="p50 Latency" value="42" unit="ms" />
 *   <MetricCard label="p99 Latency" value="142" unit="ms" />
 * </MetricCardGroup>
 * ```
 */
export interface MetricCardGroupProps
  extends KumoMetricCardGroupVariantsProps,
    // "lang" omitted to prevent it from appearing in the component API reference (inherited from HTMLAttributes)
    Omit<HTMLAttributes<HTMLDivElement>, "title" | "lang"> {
  /** Optional header text rendered in a LayerCard.Secondary section. */
  title?: ReactNode;
  /** MetricCard children to render inside the group. */
  children: ReactNode;
}

/**
 * Groups MetricCard children inside a LayerCard with an optional header
 * and configurable horizontal/vertical orientation.
 *
 * @example
 * ```tsx
 * <MetricCardGroup>
 *   <MetricCard label="Requests" value="1.2M" />
 *   <MetricCard label="Bandwidth" value="3.5" unit="GB" />
 * </MetricCardGroup>
 * ```
 */
export const MetricCardGroup = forwardRef<HTMLDivElement, MetricCardGroupProps>(
  function MetricCardGroup(
    {
      orientation = KUMO_METRIC_CARD_GROUP_DEFAULT_VARIANTS.orientation,
      title,
      children,
      className,
      ...rest
    },
    ref,
  ) {
    const innerClasses = metricCardGroupVariants({ orientation });

    return (
      <LayerCard
        className={cn("flex w-full flex-col", className)}
        ref={ref}
        {...rest}
      >
        {title && <LayerCard.Secondary>{title}</LayerCard.Secondary>}
        <LayerCard.Primary className="p-0">
          <div
            className={cn(
              innerClasses,
              "[&>*]:h-auto [&>*]:ring-0 [&>*]:rounded-none [&>*]:bg-kumo-base",
            )}
          >
            {children}
          </div>
        </LayerCard.Primary>
      </LayerCard>
    );
  },
);

MetricCardGroup.displayName = "MetricCardGroup";
