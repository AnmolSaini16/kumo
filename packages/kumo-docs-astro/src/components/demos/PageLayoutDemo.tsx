import { useState, type ReactNode } from "react";
import {
  Sidebar,
  Tabs,
  Badge,
  Button,
  Input,
  CloudflareLogo,
} from "@cloudflare/kumo";
import {
  HouseIcon,
  GearIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  GlobeIcon,
  GlobeSimpleIcon,
  FunnelIcon,
  BellIcon,
  UserCircleIcon,
  LockIcon,
  TerminalIcon,
  HardDrivesIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CodeIcon,
  ListIcon,
  PlayIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────

type LayoutVariant =
  | "scrolling"
  | "viewport-locked"
  | "two-column"
  | "sticky-filter"
  | "full-takeover"
  | "worker-detail";

const VARIANTS: { value: LayoutVariant; label: string }[] = [
  { value: "scrolling", label: "Scrolling" },
  { value: "viewport-locked", label: "Viewport Locked" },
  { value: "two-column", label: "Two-Column" },
  { value: "sticky-filter", label: "Sticky Filter" },
  { value: "full-takeover", label: "Takeover" },
  { value: "worker-detail", label: "Detail" },
];

const VARIANT_META: Record<LayoutVariant, string> = {
  scrolling:
    "Content flows naturally, body scrolls. Centered at max-width. Most settings and overview pages.",
  "viewport-locked":
    "Content fills remaining viewport height. Inner regions manage their own scroll.",
  "two-column":
    "Main content scrolls, fixed-width sidebar sticks. Product overviews and resource lists.",
  "sticky-filter":
    "Filter toolbar sticks below header as content scrolls behind it. Analytics and event pages.",
  "full-takeover":
    "Covers content area entirely. Centered form. Checkout, onboarding, setup flows.",
  "worker-detail":
    "Breadcrumb scrolls away, sticky tabs with actions persist. Full-bleed hero, two-column below.",
};

// ─── Main Demo ────────────────────────────────────────────────────────

export function PageLayoutDemo() {
  const [variant, setVariant] = useState<LayoutVariant>("scrolling");

  return (
    <div className="flex h-screen flex-col">
      {/* Variant switcher */}
      <div className="flex shrink-0 items-center justify-between border-b border-kumo-line bg-kumo-base px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-kumo-default">Layout:</span>
          <Tabs
            variant="segmented"
            size="sm"
            tabs={VARIANTS.map((v) => ({ value: v.value, label: v.label }))}
            value={variant}
            onValueChange={(v) => setVariant(v as LayoutVariant)}
          />
        </div>
        <span className="hidden text-xs text-kumo-subtle lg:block">
          {VARIANT_META[variant]}
        </span>
      </div>

      {/* Dashboard shell */}
      <Sidebar.Provider
        defaultOpen
        variant="sidebar"
        side="left"
        collapsible="icon"
        className="!min-h-0 flex-1"
      >
        <DashSidebar activeVariant={variant} />
        <main className="relative flex min-w-0 flex-1 flex-col bg-kumo-recessed">
          <div className="relative min-h-0 flex-1">
            {variant === "scrolling" && <ScrollingLayout />}
            {variant === "viewport-locked" && <ViewportLockedLayout />}
            {variant === "two-column" && <TwoColumnLayout />}
            {variant === "sticky-filter" && <StickyFilterLayout />}
            {variant === "full-takeover" && <FullTakeoverLayout />}
            {variant === "worker-detail" && <WorkerDetailLayout />}
          </div>
        </main>
      </Sidebar.Provider>
    </div>
  );
}

// ─── Dashboard Chrome ─────────────────────────────────────────────────

function DashSidebar({ activeVariant }: { activeVariant: LayoutVariant }) {
  return (
    <Sidebar>
      <Sidebar.Header className="h-12">
        <div className="flex items-center gap-2 px-1">
          <CloudflareLogo variant="glyph" className="size-5 shrink-0" />
          <span className="truncate text-sm font-semibold text-kumo-default group-data-[state=collapsed]/sidebar:hidden">
            Dashboard
          </span>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Zone: example.com</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuButton icon={HouseIcon} active={activeVariant === "scrolling"} tooltip="Overview">
              Overview
            </Sidebar.MenuButton>
            <Sidebar.MenuButton icon={ChartBarIcon} tooltip="Analytics">Analytics</Sidebar.MenuButton>
            <Sidebar.MenuButton icon={GlobeIcon} tooltip="DNS">DNS</Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Protect</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton icon={ShieldCheckIcon} active={activeVariant === "sticky-filter"} tooltip="Security">
                Security
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={LockIcon} tooltip="SSL/TLS">SSL/TLS</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Build</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton
                icon={TerminalIcon}
                active={activeVariant === "two-column" || activeVariant === "viewport-locked" || activeVariant === "worker-detail"}
                tooltip="Workers"
              >
                Workers
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={HardDrivesIcon} tooltip="Storage">Storage</Sidebar.MenuButton>
              <Sidebar.MenuButton icon={PlayIcon} tooltip="Stream">Stream</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Separator />
        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton icon={GearIcon} active={activeVariant === "full-takeover"} tooltip="Settings">
              Settings
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Trigger />
      </Sidebar.Footer>
    </Sidebar>
  );
}

function DashHeader() {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-kumo-line bg-kumo-base px-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-kumo-default">example.com</span>
        <Badge variant="success">Active</Badge>
      </div>
      <div className="flex items-center gap-1">
        <IconButton><MagnifyingGlassIcon size={16} /></IconButton>
        <IconButton><BellIcon size={16} /></IconButton>
        <IconButton><UserCircleIcon size={18} /></IconButton>
      </div>
    </div>
  );
}

function IconButton({ children }: { children: ReactNode }) {
  return (
    <button className="flex size-8 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
      {children}
    </button>
  );
}

// ─── Shared: Page Header ──────────────────────────────────────────────

function PageHeader({
  icon,
  title,
  description,
  actions,
  tabs,
  selectedTab,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  tabs?: string[];
  selectedTab?: string;
}) {
  return (
    <div className="bg-kumo-recessed px-6 pb-4 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-kumo-subtle">{icon}</div>}
            <h1 className="text-2xl font-bold text-kumo-default">{title}</h1>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {description && (
          <p className="mt-1 text-sm text-kumo-subtle">{description}</p>
        )}
        {tabs && (
          <div className="mt-4">
            <Tabs
              variant="segmented"
              tabs={tabs.map((t) => ({
                value: t.toLowerCase().replace(/\s/g, "-"),
                label: t,
              }))}
              selectedValue={selectedTab ?? tabs[0]?.toLowerCase().replace(/\s/g, "-")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared: Placeholder ──────────────────────────────────────────────

function Placeholder({ height = 120, label }: { height?: number; label?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-kumo-base text-xs text-kumo-subtle ring ring-kumo-line/50"
      style={{ height }}
    >
      {label}
    </div>
  );
}

// ─── Layout: Scrolling (DNS-style) ───────────────────────────────────

function ScrollingLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        icon={<GlobeIcon size={28} />}
        title="DNS Records"
        description="Manage DNS records for example.com"
        actions={<Button variant="secondary" size="sm">Documentation</Button>}
        tabs={["Records", "Analytics", "Settings"]}
      />
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-col gap-4">
          <Placeholder height={60} label="Search + Add Record toolbar" />
          <Placeholder height={400} label="DNS records table" />
          <Placeholder height={120} label="DNSSEC" />
          <Placeholder height={100} label="Custom Nameservers" />
          <Placeholder height={140} label="DNS Settings" />
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Viewport Locked (Logs-style) ────────────────────────────

function ViewportLockedLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <PageHeader
          icon={<ListIcon size={28} />}
          title="Workers Logs"
          description="Real-time log tail for my-worker"
        />
      </div>
      {/* Fills remaining height — no body scroll */}
      <div className="flex min-h-0 flex-1 px-6 pb-4">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-kumo-base shadow-sm ring ring-kumo-line">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-kumo-line px-3 py-2">
            <div className="flex items-center gap-2">
              <Input size="sm" placeholder="Filter logs..." aria-label="Filter" className="w-48" />
              <Tabs
                variant="segmented"
                size="sm"
                tabs={[
                  { value: "all", label: "All" },
                  { value: "errors", label: "Errors" },
                  { value: "warnings", label: "Warnings" },
                ]}
                selectedValue="all"
              />
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          {/* Log stream — scrolls independently */}
          <div className="flex-1 overflow-y-auto p-1">
            <Placeholder height={800} label="Log stream (scrolls independently)" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Two-Column (Workers for Platforms-style) ────────────────

function TwoColumnLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        icon={<TerminalIcon size={28} />}
        title="Workers for Platforms"
        description="Extend the capabilities of Cloudflare Workers to customers of your SaaS applications."
        actions={<Button variant="secondary" size="sm">Documentation</Button>}
        tabs={["Namespaces", "Detections"]}
      />
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex gap-6">
          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Placeholder height={60} label="Search + Create toolbar" />
            <Placeholder height={500} label="Dispatch namespaces table" />
          </div>
          {/* Sticky sidebar */}
          <div className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-0 flex flex-col gap-4">
              <Placeholder height={160} label="Usage metrics" />
              <Placeholder height={140} label="Next Steps" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Sticky Filter (Security Events-style) ──────────────────

function StickyFilterLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        icon={<ShieldCheckIcon size={28} />}
        title="Security Events"
        description="Analyze firewall events and blocked requests for example.com"
        tabs={["Events", "Analytics", "Rules", "Rate Limiting"]}
      />
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 border-b border-kumo-line bg-kumo-base shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-2">
          <FunnelIcon size={14} className="shrink-0 text-kumo-subtle" />
          <Input size="sm" placeholder="Filter by IP, path, rule, or ASN..." aria-label="Filter" className="w-72" />
          <Tabs
            variant="segmented"
            size="sm"
            tabs={[
              { value: "all", label: "All" },
              { value: "block", label: "Block" },
              { value: "challenge", label: "Challenge" },
              { value: "allow", label: "Allow" },
            ]}
            selectedValue="all"
          />
        </div>
      </div>
      {/* Event list — scrolls behind sticky bar */}
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 12 }, (_, i) => (
            <Placeholder key={i} height={56} label={`Event row ${i + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Full Takeover (Checkout-style) ──────────────────────────

function FullTakeoverLayout() {
  return (
    <div className="flex h-full overflow-y-auto bg-kumo-base">
      <div className="m-auto w-full max-w-md px-6 py-8">
        <button className="mb-6 flex items-center gap-1.5 text-sm text-kumo-subtle hover:text-kumo-default">
          <ArrowLeftIcon size={14} />
          Back to Workers
        </button>
        <h1 className="text-xl font-semibold text-kumo-default">Upgrade to Workers Paid</h1>
        <p className="mt-2 text-sm text-kumo-subtle">
          Unlock 10M requests/month, 30ms CPU time, and Durable Objects.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <Placeholder height={70} label="Plan summary card" />
          <Placeholder height={200} label="Payment form" />
          <Button variant="primary" className="w-full">Subscribe — $5/month</Button>
          <Button variant="ghost" className="w-full">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Worker Detail (sticky tabs + actions, hero, two-col) ────

function WorkerDetailLayout() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Breadcrumb row — scrolls away */}
      <div className="flex h-12 items-center border-b border-kumo-line bg-kumo-base px-6">
        <div className="flex w-full items-center gap-2 text-base">
          <TerminalIcon size={18} className="text-kumo-subtle" />
          <span className="text-kumo-subtle">Workers &amp; Pages</span>
          <span className="text-kumo-subtle">›</span>
          <span className="font-semibold text-kumo-default">fragrant-heart-9525</span>
        </div>
      </div>

      {/* Sticky tab bar with actions */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-kumo-line bg-kumo-base px-6">
        <div className="flex w-full items-center justify-between gap-4">
          <Tabs
            variant="segmented"
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "metrics", label: "Metrics" },
              { value: "deployments", label: "Deployments" },
              { value: "previews", label: "Previews" },
              { value: "bindings", label: "Bindings" },
              { value: "observability", label: "Observability" },
              { value: "domains", label: "Domains" },
              { value: "settings", label: "Settings" },
            ]}
            selectedValue="overview"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary">
              <CodeIcon size={16} className="mr-1.5" />
              Edit code
            </Button>
            <Button variant="primary">
              <GlobeSimpleIcon size={16} className="mr-1.5" />
              Visit
              <ArrowSquareOutIcon size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl p-6">
        {/* Deployment banner */}
        <Placeholder height={44} label="Deployment banner: fragrant-heart-9525.workers.dev · Automatic deployment" />

        {/* Architecture diagram */}
        <div className="mt-4">
          <Placeholder height={200} label="Architecture diagram (Domains → Worker → Bindings)" />
        </div>

        {/* Two-column: metrics left, sidebar right */}
        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-4">
            <Placeholder height={120} label="Metrics: Requests · Errors · CPU Time" />
            <Placeholder height={240} label="Request Distribution & Placement map" />
            <Placeholder height={100} label="Versions" />
          </div>
          <div className="flex flex-col gap-4">
            <Placeholder height={180} label="Domains & Routes" />
            <Placeholder height={200} label="Next Steps" />
          </div>
        </div>
      </div>
    </div>
  );
}
