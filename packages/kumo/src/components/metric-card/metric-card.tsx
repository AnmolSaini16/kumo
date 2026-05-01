import {
  forwardRef,
  useId,
  type ComponentType,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import type { HTMLAttributes } from "react";
import { InfoIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { cn } from "../../utils/cn";
import { Button } from "../button";
import { SkeletonLine } from "../loader/skeleton-line";
import { Text } from "../text";
import { Tooltip } from "../tooltip";

// Variants

/** MetricCard variant definitions mapping variant names to their Tailwind classes. */
export const KUMO_METRIC_CARD_VARIANTS = {
  variant: {
    default: {
      classes: "text-kumo-default",
      description: "Default metric display",
    },
    success: {
      classes: "text-kumo-success",
      description: "Success metric highlighting positive values",
    },
    danger: {
      classes: "text-kumo-danger",
      description: "Danger metric highlighting critical values",
    },
    warning: {
      classes: "text-kumo-warning",
      description: "Warning metric highlighting cautionary values",
    },
  },
} as const;

export const KUMO_METRIC_CARD_DEFAULT_VARIANTS = {
  variant: "default",
} as const;

// Derived types from KUMO_METRIC_CARD_VARIANTS
export type KumoMetricCardVariant =
  keyof typeof KUMO_METRIC_CARD_VARIANTS.variant;

export interface KumoMetricCardVariantsProps {
  /**
   * Color variant for the metric value text.
   * @default "default"
   */
  variant?: KumoMetricCardVariant;
}

export function metricCardVariants({
  variant = KUMO_METRIC_CARD_DEFAULT_VARIANTS.variant,
}: KumoMetricCardVariantsProps = {}) {
  const variantConfig = KUMO_METRIC_CARD_VARIANTS.variant[variant];
  return cn(
    "text-xl font-semibold leading-7 tabular-nums",
    variantConfig?.classes ??
      KUMO_METRIC_CARD_VARIANTS.variant[
        KUMO_METRIC_CARD_DEFAULT_VARIANTS.variant
      ].classes,
  );
}

// Sub-types

export interface MetricCardTrend {
  /** Arrow direction: up, down, or neutral (no arrow). */
  direction: "up" | "down" | "neutral";
  /** Pre-formatted trend label, e.g. "13.8%", "2.3pp", "5.1ms". */
  label: string;
  /** Semantic meaning: controls green (positive) vs red (negative) coloring. */
  isPositive: boolean;
}

/** Props passed to a custom tooltip icon component. */
export interface MetricCardTooltipIconProps {
  size?: number;
  className?: string;
}

export interface MetricCardSparkline {
  /** Array of numeric data points to plot. */
  data: number[];
  /**
   * Color theme for the sparkline. When omitted, uses the brand color.
   */
  theme?: "success" | "danger" | "neutral";
  /** Custom color that overrides `theme`, e.g. a hex value or CSS variable. */
  color?: string;
  /** Override the auto-scaled minimum y value. */
  yMin?: number;
  /** Override the auto-scaled maximum y value. */
  yMax?: number;
}

/**
 * MetricCard component props.
 *
 * @example
 * ```tsx
 * <MetricCard label="Requests" value="1.2M" />
 * <MetricCard label="Error rate" value="0.3" unit="%" variant="success" />
 * <MetricCard
 *   label="p99 Latency"
 *   value="142"
 *   unit="ms"
 *   trend={{ direction: "down", label: "12%", isPositive: true }}
 * />
 * ```
 */
export interface MetricCardProps
  extends KumoMetricCardVariantsProps,
    // "lang" omitted to prevent it from appearing in the component API reference (inherited from HTMLAttributes)
    Omit<HTMLAttributes<HTMLElement>, "onClick" | "lang"> {
  /** Label text displayed above the value. */
  label: string;
  /** Pre-formatted metric value, e.g. "1.2M", "99.9". */
  value: string;
  /** Unit displayed after the value in smaller text, e.g. "%", "ms". */
  unit?: string;
  /** Trend indicator with direction arrow and label. */
  trend?: MetricCardTrend;
  /** Sparkline chart rendered at the bottom of the card. */
  sparkline?: MetricCardSparkline;
  /** When set, renders the card as an anchor element. */
  href?: string;
  /** Click handler. Renders as a button when no `href` is provided. */
  onClick?: MouseEventHandler<HTMLElement>;
  /**
   * Shows skeleton loading state for the value.
   * @default false
   */
  loading?: boolean;
  /**
   * Shows an em-dash placeholder in place of the value.
   * @default false
   */
  error?: boolean;
  /** Content displayed in a tooltip next to the label. */
  tooltip?: ReactNode;
  /** Custom icon component for the tooltip trigger. Defaults to Info icon from Phosphor. */
  tooltipIcon?: ComponentType<MetricCardTooltipIconProps>;
}

// Sparkline (internal)

const SPARKLINE_THEME_COLORS: Record<
  NonNullable<MetricCardSparkline["theme"]>,
  string
> = {
  success: "var(--text-color-kumo-success)",
  danger: "var(--text-color-kumo-danger)",
  neutral: "var(--text-color-kumo-subtle)",
};

const DEFAULT_SPARKLINE_COLOR = "var(--color-kumo-brand)";

function Sparkline({ data, theme, color, yMin, yMax }: MetricCardSparkline) {
  const gradientId = useId();

  if (data.length === 0) return null;

  // Ensure at least two points for a meaningful line
  const points = data.length === 1 ? [data[0], data[0]] : data;

  const min = yMin ?? Math.min(...points);
  const max = yMax ?? Math.max(...points);
  const range = max - min || 1; // Avoid division by zero for flat lines

  const height = 32;
  const width = points.length * 8;
  // Vertical padding so the stroke isn't clipped at top or bottom
  const strokePad = 2;

  const resolvedColor =
    color ?? (theme ? SPARKLINE_THEME_COLORS[theme] : DEFAULT_SPARKLINE_COLOR);

  // Map data points to SVG coordinates
  // x range: [0, width] — line spans full width edge-to-edge
  // y range: [strokePad, height - strokePad] — vertical padding to avoid clipping
  const drawHeight = height - strokePad * 2;
  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = strokePad + drawHeight * (1 - (value - min) / range);
    return `${x},${y}`;
  });

  const polylinePoints = coords.join(" ");

  // Close the polygon at the bottom edge for the gradient fill
  const polygonPoints = `${polylinePoints} ${width},${height} 0,${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-[30px] w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={polygonPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Trend indicator (internal)

function TrendIndicator({ direction, label, isPositive }: MetricCardTrend) {
  const colorClass =
    direction === "neutral"
      ? "text-kumo-subtle"
      : isPositive
        ? "text-kumo-success"
        : "text-kumo-danger";

  return (
    <span
      className={cn("inline-flex items-baseline gap-1 text-xs", colorClass)}
    >
      {direction === "up" && (
        <TrendUpIcon size={12} weight="bold" aria-hidden="true" />
      )}
      {direction === "down" && (
        <TrendDownIcon size={12} weight="bold" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

// MetricCard

const BASE_CLASSES =
  "flex h-full min-w-[170px] flex-col overflow-hidden rounded-lg bg-kumo-base text-left ring ring-kumo-line";

const CONTENT_CLASSES = "flex flex-col p-4 gap-px";

const INTERACTIVE_CLASSES =
  "cursor-pointer transition-colors hover:bg-kumo-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand";

/**
 * Compact card displaying a single metric with optional trend indicator,
 * sparkline, loading/error states, and tooltip.
 *
 * @example
 * ```tsx
 * <MetricCard label="Requests" value="1.2M" />
 * ```
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Error Rate"
 *   value="0.12"
 *   unit="%"
 *   variant="danger"
 *   trend={{ direction: "up", label: "3.2%", isPositive: false }}
 *   sparkline={{ data: [0.08, 0.09, 0.11, 0.12], theme: "danger" }}
 * />
 * ```
 */
export const MetricCard = forwardRef<HTMLElement, MetricCardProps>(
  function MetricCard(
    {
      label,
      value,
      unit,
      variant = KUMO_METRIC_CARD_DEFAULT_VARIANTS.variant,
      trend,
      sparkline,
      href,
      onClick,
      loading = false,
      error = false,
      tooltip,
      tooltipIcon,
      className,
      ...rest
    },
    ref,
  ) {
    const isInteractive = Boolean(href) || Boolean(onClick);

    // Content

    const displayValue = error ? "\u2014" : value;
    const showSparkline = !loading && !error && sparkline;

    const TooltipIconComponent = tooltipIcon ?? InfoIcon;

    const labelRow = (
      <Text
        DANGEROUS_className="flex items-center gap-1.5 font-normal"
        as="span"
        variant="secondary"
      >
        {label}
        {tooltip && (
          <Tooltip
            content={tooltip}
            render={
              <Button
                variant="ghost"
                size="xs"
                shape="square"
                aria-label="More information"
                className="text-kumo-subtle"
              >
                <TooltipIconComponent size={14} />
              </Button>
            }
          />
        )}
      </Text>
    );

    const valueRow = loading ? (
      <SkeletonLine minWidth={40} maxWidth={70} blockHeight="1.75rem" />
    ) : (
      <div className="flex items-baseline gap-2">
        <div className="flex items-baseline gap-0.5">
          <span className={metricCardVariants({ variant })}>
            {displayValue}
          </span>
          {!error && unit && (
            <Text as="span" size="sm" variant="secondary">
              {unit}
            </Text>
          )}
        </div>
        {!error && trend && <TrendIndicator {...trend} />}
      </div>
    );

    const content = (
      <>
        <div className={CONTENT_CLASSES}>
          {labelRow}
          {valueRow}
        </div>
        {showSparkline && (
          <div className="pointer-events-none mt-auto h-[30px] w-full overflow-hidden rounded-b-lg">
            <Sparkline {...sparkline} />
          </div>
        )}
      </>
    );

    // Polymorphic element

    const sharedClassName = cn(
      BASE_CLASSES,
      isInteractive && INTERACTIVE_CLASSES,
      className,
    );

    if (href) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          onClick={onClick}
          className={cn(sharedClassName, "no-underline")}
          {...(rest as HTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    if (onClick) {
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          className={sharedClassName}
          {...(rest as HTMLAttributes<HTMLButtonElement>)}
        >
          {content}
        </button>
      );
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={sharedClassName}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        {content}
      </div>
    );
  },
);

MetricCard.displayName = "MetricCard";
