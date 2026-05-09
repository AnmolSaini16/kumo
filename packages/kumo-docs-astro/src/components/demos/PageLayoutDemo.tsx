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
  LockIcon,
  TerminalIcon,
  HardDrivesIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CodeIcon,
  ListIcon,
  PlayIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE CHROME PRIMITIVES
//
// These are the official building blocks for page layout. Every page
// composes from this same set. The rules:
//
//   1. PageChrome    → white bar, breadcrumbs + actions. Always present.
//   2. PageTabs      → underline tabs for page-level navigation. Optional.
//   3. PageFilterBar → sticky toolbar for tab-specific filters. Optional.
//   4. PageContent   → gray canvas. Cards (white) sit on top.
//   5. Card          → white surface for content sections.
//
// Chrome is flush edge-to-edge. No max-width constraints — content
// fills the available space. No hero titles. No description blocks.
// The sidebar provides context; the breadcrumb confirms location.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** White top bar. Breadcrumbs left, page actions + global actions right. */
function PageChrome({
  breadcrumbs,
  actions,
}: {
  breadcrumbs: { icon?: ReactNode; label: string; active?: boolean }[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-kumo-line bg-kumo-base px-5">
      <nav className="flex items-center gap-1.5 text-base">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-kumo-subtle">›</span>}
            {crumb.icon && <span className="text-kumo-subtle">{crumb.icon}</span>}
            <span className={crumb.active ? "font-semibold text-kumo-default" : "text-kumo-subtle"}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        {/* Page-specific actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {/* Global actions — always present */}
        {actions && <div className="h-4 w-px bg-kumo-line" />}
        <GlobalActions />
      </div>
    </div>
  );
}

/** Global actions that appear on every page. */
function GlobalActions() {
  return (
    <div className="flex items-center gap-1">
      <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
        Ask AI
      </button>
      <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
        Support
      </button>
      <button className="flex size-7 items-center justify-center rounded-full bg-kumo-tint text-xs font-medium text-kumo-default">
        M
      </button>
    </div>
  );
}

/** Segmented tabs for page-level navigation. Actions on the right. Scrolls on mobile with overflow menu. */
function PageTabs({
  tabs,
  selected,
  actions,
}: {
  tabs: string[];
  selected?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-kumo-line bg-kumo-base px-5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 overflow-x-auto scrollbar-hide">
          <Tabs
            variant="segmented"
            size="sm"
            tabs={tabs.map((t) => ({
              value: t.toLowerCase().replace(/\s/g, "-"),
              label: t,
            }))}
            selectedValue={selected ?? tabs[0]?.toLowerCase().replace(/\s/g, "-")}
          />
        </div>
        {/* Overflow menu — visible when tabs can't all fit */}
        <button className="flex size-8 shrink-0 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default lg:hidden">
          <DotsThreeIcon size={16} weight="bold" />
        </button>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Sticky filter toolbar. Part of page content, not chrome. Stacks below sticky tabs. */
function PageFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-14 z-9 mx-5 mt-5 flex items-center gap-2 rounded-lg bg-kumo-base px-3 py-2 ring ring-kumo-line/50">
      {children}
    </div>
  );
}

/** Gray canvas. All page content lives here. */
function PageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className ?? ""}`}>{children}</div>;
}

/** White card surface. Sits on the gray canvas. */
function Card({
  children,
  height,
  label,
}: {
  children?: ReactNode;
  height?: number;
  label?: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-kumo-base text-xs text-kumo-subtle ring ring-kumo-line/50"
      style={height ? { height } : undefined}
    >
      {children ?? label}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO HARNESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type LayoutVariant =
  | "scrolling"
  | "viewport-locked"
  | "two-column"
  | "sticky-filter"
  | "full-takeover"
  | "worker-detail";

const VARIANTS: { value: LayoutVariant; label: string }[] = [
  { value: "scrolling", label: "Scrolling" },
  { value: "viewport-locked", label: "Locked" },
  { value: "two-column", label: "Two-Col" },
  { value: "sticky-filter", label: "Filter" },
  { value: "full-takeover", label: "Takeover" },
  { value: "worker-detail", label: "Detail" },
];

const VARIANT_DESC: Record<LayoutVariant, string> = {
  scrolling: "Body scrolls. Most settings and list pages.",
  "viewport-locked": "Content fills viewport. Inner scroll regions.",
  "two-column": "Main + sticky sidebar. Resource overviews.",
  "sticky-filter": "Sticky filter bar below tabs. Analytics pages.",
  "full-takeover": "Centered form. Checkout and onboarding.",
  "worker-detail": "Breadcrumb + sticky tabs + actions. Detail pages.",
};

export function PageLayoutDemo() {
  const [variant, setVariant] = useState<LayoutVariant>("scrolling");

  return (
    <div className="flex h-screen flex-col">
      {/* Demo-only: variant switcher */}
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
          {VARIANT_DESC[variant]}
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
          <div className="relative flex min-h-0 flex-1 flex-col">
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIDEBAR (shared dashboard chrome)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DashSidebar({ activeVariant }: { activeVariant: LayoutVariant }) {
  return (
    <Sidebar>
      <Sidebar.Header className="h-14">
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
            <Sidebar.MenuButton icon={GlobeIcon} active={activeVariant === "scrolling"} tooltip="DNS">DNS</Sidebar.MenuButton>
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
                active={["two-column", "viewport-locked", "worker-detail"].includes(activeVariant)}
                tooltip="Workers"
              >
                Workers &amp; Pages
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Scrolling (DNS Records)
//
// Pattern: chrome → tabs → scrolling content with cards
// Used by: DNS, SSL/TLS, most settings pages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ScrollingLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        breadcrumbs={[
          { icon: <GlobeIcon size={16} />, label: "DNS" },
          { label: "example.com", active: true },
        ]}
      />
      <PageTabs
        tabs={["Records", "Analytics", "Settings"]}
        actions={<Button variant="secondary" size="sm">Documentation</Button>}
      />
      <PageContent>
        <div className="flex flex-col gap-3">
          <Card height={48} label="Search + Add Record toolbar" />
          <Card height={400} label="DNS records table" />
          <Card height={100} label="DNSSEC" />
          <Card height={80} label="Custom Nameservers" />
          <Card height={100} label="DNS Settings" />
        </div>
      </PageContent>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Viewport Locked (Workers Logs)
//
// Pattern: chrome → single card fills remaining viewport
// Used by: Logs, Trace, any streaming/terminal view
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ViewportLockedLayout() {
  return (
    <div className="flex h-full flex-col">
      <PageChrome
        breadcrumbs={[
          { icon: <TerminalIcon size={16} />, label: "Workers & Pages" },
          { label: "fragrant-heart-9525" },
          { label: "Logs", active: true },
        ]}
      />
      {/* Single card fills remaining space */}
      <div className="flex min-h-0 flex-1 p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-kumo-base ring ring-kumo-line/50">
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
          <div className="flex-1 overflow-y-auto p-1">
            <Card height={800} label="Log stream (scrolls independently)" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Two-Column (Workers for Platforms)
//
// Pattern: chrome → tabs → main content + sticky sidebar
// Used by: Workers index, any resource list with summary stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TwoColumnLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        breadcrumbs={[
          { icon: <TerminalIcon size={16} />, label: "Workers & Pages", active: true },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm">Documentation</Button>
            <Button variant="primary" size="sm">Create application</Button>
          </>
        }
      />
      <PageTabs tabs={["Namespaces", "Detections"]} />
      <PageContent>
        <div className="flex gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Card height={48} label="Search + Create toolbar" />
            <Card height={500} label="Dispatch namespaces table" />
          </div>
          <div className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-0 flex flex-col gap-3">
              <Card height={160} label="Usage metrics" />
              <Card height={140} label="Next Steps" />
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Sticky Filter (Security Events)
//
// Pattern: chrome → tabs → sticky filter bar → scrolling list
// Used by: Security Events, Analytics, any filterable list
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StickyFilterLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        breadcrumbs={[
          { icon: <ShieldCheckIcon size={16} />, label: "Security" },
          { label: "Events", active: true },
        ]}
      />
      <PageTabs tabs={["Events", "Analytics", "Rules", "Rate Limiting"]} />
      <PageFilterBar>
        <FunnelIcon size={14} className="shrink-0 text-kumo-subtle" />
        <Input size="sm" placeholder="Filter by IP, path, rule, or ASN..." aria-label="Filter" className="w-64" />
        <Tabs
          variant="segmented"
          size="sm"
          tabs={[
            { value: "all", label: "All" },
            { value: "block", label: "Block" },
            { value: "challenge", label: "Challenge" },
          ]}
          selectedValue="all"
        />
      </PageFilterBar>
      <PageContent>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 12 }, (_, i) => (
            <Card key={i} height={52} label={`Event row ${i + 1}`} />
          ))}
        </div>
      </PageContent>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Full Takeover (Checkout)
//
// Pattern: white canvas, centered content, back link
// Used by: Plan upgrades, onboarding, setup wizards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
          <Card height={70} label="Plan summary card" />
          <Card height={200} label="Payment form" />
          <Button variant="primary" className="w-full">Subscribe — $5/month</Button>
          <Button variant="ghost" className="w-full">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Worker Detail (sticky tabs + actions)
//
// Pattern: chrome (breadcrumb) → tabs with inline actions → content
// Used by: Worker detail, Pages project, any resource detail page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WorkerDetailLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        breadcrumbs={[
          { icon: <TerminalIcon size={16} />, label: "Workers & Pages" },
          { label: "fragrant-heart-9525", active: true },
        ]}
      />
      <PageTabs
        tabs={["Overview", "Metrics", "Deployments", "Previews", "Bindings", "Observability", "Domains", "Settings"]}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <CodeIcon size={14} />
              Edit code
            </Button>
            <Button variant="primary" size="sm">
              <GlobeSimpleIcon size={14} />
              Visit
              <ArrowSquareOutIcon size={12} />
            </Button>
          </>
        }
      />
      <PageContent>
        <div className="flex flex-col gap-3">
          <Card height={44} label="Deployment banner" />
          <Card height={200} label="Architecture diagram (Domains → Worker → Bindings)" />
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-3">
              <Card height={120} label="Metrics: Requests · Errors · CPU Time" />
              <Card height={240} label="Request Distribution & Placement map" />
              <Card height={100} label="Versions" />
            </div>
            <div className="flex flex-col gap-3">
              <Card height={180} label="Domains & Routes" />
              <Card height={200} label="Next Steps" />
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
