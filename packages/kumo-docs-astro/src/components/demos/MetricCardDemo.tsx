import { MetricCard, MetricCardGroup, Button } from "@cloudflare/kumo";
import { ArrowRightIcon, QuestionIcon } from "@phosphor-icons/react";

export function MetricCardGroupDemo() {
  return (
    <MetricCardGroup title="Workers Analytics">
      <MetricCard
        label="Requests"
        value="1.2"
        unit="M"
        trend={{ direction: "up", label: "12%", isPositive: true }}
      />
      <MetricCard
        label="CPU Time (P90)"
        value="3.2"
        unit="ms"
        trend={{ direction: "down", label: "8%", isPositive: true }}
        sparkline={{
          data: [
            4.1, 3.9, 4.2, 3.8, 3.5, 3.9, 3.6, 3.4, 3.7, 3.3, 3.5, 3.1, 3.4,
            3.0, 3.3, 3.2,
          ],
        }}
      />
      <MetricCard
        label="Errors"
        value="842"
        trend={{ direction: "up", label: "13.8%", isPositive: false }}
      />
      <MetricCard label="Wall Time" value="24" unit="ms" />
    </MetricCardGroup>
  );
}

export function MetricCardHorizontalGroupDemo() {
  return (
    <MetricCardGroup title="Summary">
      <MetricCard
        label="Total requests"
        value="2.8"
        unit="M"
        trend={{ direction: "up", label: "9%", isPositive: true }}
        sparkline={{
          data: [
            1.9, 2.1, 2.0, 2.3, 2.1, 2.4, 2.2, 2.5, 2.3, 2.6, 2.4, 2.7, 2.6,
            2.8,
          ],
          color: "var(--color-kumo-brand)",
        }}
      />
      <MetricCard label="Successful requests" value="2.7" unit="M" />
      <MetricCard label="Failed requests" value="12.4" unit="k" />
    </MetricCardGroup>
  );
}

export function MetricCardGroupVerticalDemo() {
  return (
    <div className="max-w-xs">
      <MetricCardGroup orientation="vertical" title="Registrar">
        <MetricCard label="Active domains" value="142" />
        <MetricCard label="Expiring soon" value="3" />
        <MetricCard label="Pending transfers" value="2" />
      </MetricCardGroup>
    </div>
  );
}

export function MetricCardGroupWithoutTitleDemo() {
  return (
    <MetricCardGroup>
      <MetricCard
        label="Web traffic"
        value="2.4"
        unit="M"
        sparkline={{
          data: [1.8, 2.1, 1.9, 2.3, 2.0, 2.4, 2.2, 2.5, 2.1, 2.6, 2.3, 2.4],
        }}
      />
      <MetricCard
        label="Total bandwidth"
        value="1.8"
        unit="PB"
        sparkline={{
          data: [
            1.2, 1.25, 1.3, 1.28, 1.35, 1.4, 1.38, 1.45, 1.5, 1.48, 1.55, 1.6,
            1.8,
          ],
        }}
      />
      <MetricCard
        label="Cache rate"
        value="89.2"
        unit="%"
        sparkline={{
          data: [
            85, 86.5, 84, 87, 85.5, 88, 86, 89, 87.5, 88.5, 86.5, 88, 89, 89.2,
          ],
        }}
      />
    </MetricCardGroup>
  );
}

export function MetricCardVariantsDemo() {
  return (
    <MetricCardGroup title="Health">
      <MetricCard
        label="CPU Time (P90)"
        value="4.1"
        unit="ms"
        variant="default"
      />
      <MetricCard
        label="Request duration"
        value="45"
        unit="ms"
        variant="success"
      />
      <MetricCard
        label="Workers errors"
        value="2.3"
        unit="k"
        variant="danger"
        trend={{ direction: "up", label: "0.8%", isPositive: false }}
      />
      <MetricCard
        label="Subrequests"
        value="847"
        unit="k"
        variant="warning"
        trend={{ direction: "up", label: "23%", isPositive: false }}
      />
    </MetricCardGroup>
  );
}

export function MetricCardStatesDemo() {
  return (
    <MetricCardGroup title="Dashboard">
      <MetricCard
        label="Workers invocations"
        value="12.4"
        unit="k"
        trend={{ direction: "up", label: "8%", isPositive: true }}
      />
      <MetricCard label="Build minutes" value="" loading />
      <MetricCard label="Logins blocked" value="" error />
    </MetricCardGroup>
  );
}

export function MetricCardSparklineDemo() {
  return (
    <MetricCardGroup title="Traffic Overview">
      <MetricCard
        label="Bandwidth"
        value="3.5"
        unit="GB"
        sparkline={{
          data: [
            2.1, 2.4, 2.2, 2.7, 2.5, 2.9, 2.6, 3.1, 2.8, 3.2, 3.0, 3.4, 3.3,
            3.5,
          ],
          theme: "success",
        }}
      />
      <MetricCard
        label="Visits"
        value="48.2"
        unit="k"
        sparkline={{
          data: [32, 35, 33, 38, 36, 40, 37, 42, 39, 44, 41, 48.2],
          theme: "neutral",
        }}
      />
      <MetricCard
        label="Page views"
        value="126"
        unit="k"
        sparkline={{
          data: [85, 90, 82, 95, 88, 102, 92, 108, 97, 115, 105, 120, 110, 126],
          theme: "danger",
        }}
      />
      <MetricCard
        label="Cached requests"
        value="92.1"
        unit="%"
        sparkline={{
          data: [
            88, 89.5, 87, 90, 88.5, 91, 89, 91.5, 90, 92, 90.5, 91.8, 91, 92.1,
          ],
          color: "var(--text-color-kumo-brand)",
        }}
      />
    </MetricCardGroup>
  );
}

export function MetricCardInteractiveDemo() {
  return (
    <MetricCardGroup
      title={
        <div className="flex w-full items-center justify-between">
          <div>Workers Overview</div>
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            aria-label="View all workers"
          >
            <ArrowRightIcon size={16} />
          </Button>
        </div>
      }
    >
      <MetricCard
        label="Requests"
        value="1.2"
        unit="M"
        tooltip="Total HTTP requests in the selected period"
        href="#"
      />
      <MetricCard
        label="CPU Time (P90)"
        value="3.2"
        unit="ms"
        tooltip="90th percentile CPU time per invocation"
        tooltipIcon={QuestionIcon}
        href="#"
      />
      <MetricCard
        label="Errors"
        value="842"
        tooltip="Failed invocations returning non-2xx status"
        onClick={() => {}}
      />
    </MetricCardGroup>
  );
}
