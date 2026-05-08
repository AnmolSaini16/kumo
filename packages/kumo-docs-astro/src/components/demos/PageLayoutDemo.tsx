import { useState, type ReactNode } from "react";
import {
  Sidebar,
  Tabs,
  Badge,
  Button,
  Input,
  LayerCard,
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

const VARIANT_META: Record<
  LayoutVariant,
  { title: string; description: string }
> = {
  scrolling: {
    title: "Scrolling Page",
    description:
      "Content flows naturally, body scrolls. Centered at max-width. Header and tabs can stick. Most settings and overview pages use this.",
  },
  "viewport-locked": {
    title: "Viewport Locked",
    description:
      "Content fills remaining viewport height. No body scroll. Inner regions like log streams or editors manage their own scroll.",
  },
  "two-column": {
    title: "Two-Column + Sticky Sidebar",
    description:
      "Main content scrolls while a fixed-width sidebar sticks. Collapses to stacked on mobile. Product overviews and resource lists.",
  },
  "sticky-filter": {
    title: "Sticky Filter Bar",
    description:
      "A filter toolbar sticks below the header as content scrolls behind it. Security analytics, audit logs, observability.",
  },
  "full-takeover": {
    title: "Full-Page Takeover",
    description:
      "Covers the content area entirely. Centered form or wizard. Checkout, onboarding, setup flows.",
  },
  "worker-detail": {
    title: "Worker Detail",
    description:
      "Breadcrumb header scrolls away, sticky tabs with right-aligned actions persist. Full-bleed hero, two-column content below with non-sticky sidebar.",
  },
};

// ─── Main Demo ────────────────────────────────────────────────────────

export function PageLayoutDemo() {
  const [variant, setVariant] = useState<LayoutVariant>("scrolling");

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar: variant switcher + description */}
      <div className="flex shrink-0 items-center justify-between border-b border-kumo-line bg-kumo-base px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-kumo-default">
            Layout:
          </span>
          <Tabs
            variant="segmented"
            size="sm"
            tabs={VARIANTS.map((v) => ({
              value: v.value,
              label: v.label,
            }))}
            value={variant}
            onValueChange={(v) => setVariant(v as LayoutVariant)}
          />
        </div>
        <span className="hidden text-xs text-kumo-subtle lg:block">
          {VARIANT_META[variant].description}
        </span>
      </div>

      {/* Dashboard shell — Sidebar.Provider creates a flex row */}
      <Sidebar.Provider
        defaultOpen
        variant="sidebar"
        side="left"
        collapsible="icon"
        className="min-h-0 flex-1 !min-h-0"
        style={{ minHeight: 0 }}
      >
        <DashSidebar activeVariant={variant} />

        {/* Content area — direct sibling of Sidebar inside Provider */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-kumo-overlay">
          <DashHeader />
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
      <Sidebar.Header>
        <div className="flex items-center gap-2 px-2">
          <CloudflareLogo variant="glyph" className="size-5" />
          <span className="text-sm font-semibold text-kumo-default">
            Dashboard
          </span>
        </div>
      </Sidebar.Header>

      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Zone: example.com</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuButton
              icon={HouseIcon}
              active={activeVariant === "scrolling"}
              tooltip="Overview"
            >
              Overview
            </Sidebar.MenuButton>
            <Sidebar.MenuButton icon={ChartBarIcon} tooltip="Analytics">
              Analytics
            </Sidebar.MenuButton>
            <Sidebar.MenuButton
              icon={GlobeIcon}
              tooltip="DNS"
            >
              DNS
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>

        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Protect</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton
                icon={ShieldCheckIcon}
                active={activeVariant === "sticky-filter"}
                tooltip="Security"
              >
                Security
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={LockIcon} tooltip="SSL/TLS">
                SSL/TLS
              </Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Build</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton
                icon={TerminalIcon}
                active={
                  activeVariant === "two-column" ||
                  activeVariant === "viewport-locked"
                }
                tooltip="Workers"
              >
                Workers
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={HardDrivesIcon} tooltip="Storage">
                Storage
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={PlayIcon} tooltip="Stream">
                Stream
              </Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Separator />

        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton
              icon={GearIcon}
              active={activeVariant === "full-takeover"}
              tooltip="Settings"
            >
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
        <button className="flex size-8 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
          <MagnifyingGlassIcon size={16} />
        </button>
        <button className="flex size-8 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
          <BellIcon size={16} />
        </button>
        <button className="flex size-8 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default">
          <UserCircleIcon size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Layout: Scrolling Page (DNS Records style) ──────────────────────

function ScrollingLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        <DemoPageHeader
          icon={<GlobeIcon size={24} />}
          title="DNS Records"
          description="Manage DNS records for example.com"
          actions={<Button variant="secondary" size="sm">Documentation</Button>}
          tabs={["Records", "Analytics", "Settings"]}
        />

        {/* Search bar */}
        <div className="mt-6 flex items-center gap-3">
          <Input
            size="sm"
            placeholder="Search records..."
            aria-label="Search DNS records"
            className="w-64"
          />
          <Button variant="primary" size="sm">
            Add Record
          </Button>
        </div>

        {/* Records table */}
        <div className="mt-4 overflow-hidden rounded-lg border border-kumo-line bg-kumo-base">
          <div className="grid grid-cols-[1fr_80px_1fr_80px_60px] gap-x-4 border-b border-kumo-line px-4 py-2.5 text-xs font-medium text-kumo-subtle">
            <span>Name</span>
            <span>Type</span>
            <span>Content</span>
            <span>TTL</span>
            <span>Proxy</span>
          </div>
          {DNS_RECORDS.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_80px_1fr_80px_60px] items-center gap-x-4 border-b border-kumo-hairline px-4 py-3 text-sm last:border-b-0"
            >
              <span className="truncate font-medium text-kumo-default">
                {r.name}
              </span>
              <Badge variant={r.type === "A" ? "info" : "default"}>
                {r.type}
              </Badge>
              <span className="truncate font-mono text-xs text-kumo-subtle">
                {r.content}
              </span>
              <span className="text-kumo-subtle">{r.ttl}</span>
              <span
                className={
                  r.proxied ? "text-kumo-brand" : "text-kumo-subtle"
                }
              >
                {r.proxied ? "On" : "Off"}
              </span>
            </div>
          ))}
        </div>

        {/* More content to make the page scroll */}
        <div className="mt-6">
          <PlaceholderCard title="DNSSEC" height={120} />
        </div>
        <div className="mt-4">
          <PlaceholderCard title="Custom Nameservers" height={100} />
        </div>
        <div className="mt-4">
          <PlaceholderCard title="DNS Settings" height={140} />
        </div>
      </div>
    </div>
  );
}

const DNS_RECORDS = [
  { name: "example.com", type: "A", content: "192.0.2.1", ttl: "Auto", proxied: true },
  { name: "www", type: "CNAME", content: "example.com", ttl: "Auto", proxied: true },
  { name: "api", type: "A", content: "192.0.2.10", ttl: "Auto", proxied: true },
  { name: "mail", type: "MX", content: "mail.example.com", ttl: "3600", proxied: false },
  { name: "_dmarc", type: "TXT", content: "v=DMARC1; p=reject; rua=...", ttl: "Auto", proxied: false },
  { name: "staging", type: "CNAME", content: "staging.pages.dev", ttl: "Auto", proxied: true },
  { name: "cdn", type: "A", content: "192.0.2.20", ttl: "Auto", proxied: true },
  { name: "legacy", type: "A", content: "192.0.2.99", ttl: "1800", proxied: false },
  { name: "_acme-challenge", type: "TXT", content: "abc123def456...", ttl: "Auto", proxied: false },
  { name: "status", type: "CNAME", content: "status.example.com", ttl: "Auto", proxied: false },
  { name: "blog", type: "CNAME", content: "blog.pages.dev", ttl: "Auto", proxied: true },
  { name: "dev", type: "A", content: "192.0.2.50", ttl: "Auto", proxied: true },
];

// ─── Layout: Viewport Locked (Logs/Tail style) ──────────────────────

function ViewportLockedLayout() {
  return (
    <div className="flex h-full flex-col">
      {/* Page header — does not scroll */}
      <div className="mx-auto w-full max-w-5xl shrink-0 px-6 pt-6 pb-4">
        <DemoPageHeader
          icon={<ListIcon size={24} />}
          title="Workers Logs"
          description="Real-time log tail for my-worker"
        />
      </div>

      {/* Log viewer — fills remaining height */}
      <div className="flex min-h-0 flex-1 px-6 pb-4">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kumo-line bg-kumo-base">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-kumo-line px-3 py-2">
            <div className="flex items-center gap-2">
              <Input
                size="sm"
                placeholder="Filter logs..."
                aria-label="Filter"
                className="w-48"
              />
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
          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {LOG_LINES.map((line, i) => (
              <div
                key={i}
                className="flex gap-3 border-b border-kumo-hairline px-3 py-1.5 hover:bg-kumo-tint"
              >
                <span className="shrink-0 text-kumo-subtle">{line.time}</span>
                <span
                  className={`shrink-0 w-10 ${
                    line.level === "ERR"
                      ? "text-kumo-danger"
                      : line.level === "WARN"
                        ? "text-kumo-warning"
                        : "text-kumo-subtle"
                  }`}
                >
                  {line.level}
                </span>
                <span className="text-kumo-default">{line.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const LOG_LINES = Array.from({ length: 60 }, (_, i) => ({
  time: `${String(10 + Math.floor(i / 6)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}.${String((i * 37) % 1000).padStart(3, "0")}`,
  level: i % 11 === 0 ? "ERR" : i % 7 === 0 ? "WARN" : "INFO",
  message: [
    "Incoming request GET /api/users",
    "Cache HIT for /static/main.js",
    "KV GET key=session_abc123 latency=2ms",
    "Subrequest to origin https://api.example.com/v1/data",
    "Response 200 OK in 12ms",
    "R2 PUT object=uploads/img_382.png size=1.2MB",
    "Durable Object alarm fired id=counter-west",
    "WebSocket connection opened",
    "Queue message published topic=events",
    "Error: ECONNREFUSED 10.0.0.5:5432",
    "Rate limit exceeded for IP 203.0.113.42",
    "Workers AI inference llama-3 tokens=128 latency=340ms",
  ][i % 12],
}));

// ─── Layout: Two-Column (Workers Overview style) ─────────────────────

function TwoColumnLayout() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        <DemoPageHeader
          icon={<TerminalIcon size={24} />}
          title="Workers for Platforms"
          description="Extend the capabilities of Cloudflare Workers to customers of your SaaS applications."
          actions={<Button variant="secondary" size="sm">Documentation</Button>}
          tabs={["Namespaces", "Detections"]}
        />

        <div className="mt-6 flex gap-6">
          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-4">
              <MetricCard label="Requests (24h)" value="1.24M" change="+12%" />
              <MetricCard label="Errors (24h)" value="342" change="-8%" positive />
              <MetricCard label="P50 CPU (ms)" value="3.2" change="+0.4" />
            </div>

            <PlaceholderCard title="Requests Over Time" height={180} />

            {/* Workers list */}
            <div className="rounded-lg border border-kumo-line bg-kumo-base">
              <div className="border-b border-kumo-line px-4 py-3 text-sm font-medium text-kumo-default">
                Your Workers
              </div>
              {WORKERS.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-kumo-hairline px-4 py-3 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-medium text-kumo-default">
                      {w.name}
                    </div>
                    <div className="text-xs text-kumo-subtle">
                      {w.routes}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-kumo-subtle">
                      {w.requests}
                    </span>
                    <Badge variant={w.status === "Active" ? "success" : "default"}>
                      {w.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-0 flex flex-col gap-4">
              <LayerCard>
                <LayerCard.Secondary>Quick Actions</LayerCard.Secondary>
                <LayerCard.Primary>
                  <div className="flex flex-col gap-2">
                    <Button variant="primary" size="sm" className="w-full">
                      Create Worker
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full">
                      Deploy from GitHub
                    </Button>
                  </div>
                </LayerCard.Primary>
              </LayerCard>

              <LayerCard>
                <LayerCard.Secondary>Plan Usage</LayerCard.Secondary>
                <LayerCard.Primary>
                  <div className="flex flex-col gap-3 text-sm">
                    <UsageRow
                      label="Requests"
                      used="1.24M"
                      limit="10M"
                      percent={12}
                    />
                    <UsageRow
                      label="CPU Time"
                      used="45ms avg"
                      limit="50ms"
                      percent={90}
                    />
                    <UsageRow
                      label="Workers"
                      used="12"
                      limit="30"
                      percent={40}
                    />
                  </div>
                </LayerCard.Primary>
              </LayerCard>

              <LayerCard>
                <LayerCard.Secondary>Resources</LayerCard.Secondary>
                <LayerCard.Primary>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <a className="text-kumo-brand hover:underline" href="#">
                      Workers documentation
                    </a>
                    <a className="text-kumo-brand hover:underline" href="#">
                      Community Discord
                    </a>
                    <a className="text-kumo-brand hover:underline" href="#">
                      Pricing calculator
                    </a>
                  </div>
                </LayerCard.Primary>
              </LayerCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const WORKERS = [
  { name: "api-gateway", routes: "api.example.com/*", requests: "842K/day", status: "Active" },
  { name: "auth-worker", routes: "auth.example.com/*", requests: "124K/day", status: "Active" },
  { name: "image-resizer", routes: "img.example.com/*", requests: "56K/day", status: "Active" },
  { name: "cron-cleanup", routes: "Cron: 0 * * * *", requests: "24/day", status: "Active" },
  { name: "legacy-redirect", routes: "old.example.com/*", requests: "2.1K/day", status: "Active" },
  { name: "staging-proxy", routes: "staging.example.com/*", requests: "312/day", status: "Paused" },
];

// ─── Layout: Sticky Filter (Security Events style) ───────────────────

function StickyFilterLayout() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Page header — scrolls away */}
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <DemoPageHeader
          icon={<ShieldCheckIcon size={24} />}
          title="Security Events"
          description="Analyze firewall events and blocked requests for example.com"
          tabs={["Events", "Analytics", "Rules", "Rate Limiting"]}
        />
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 mt-4 border-y border-kumo-line bg-kumo-overlay/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-2">
          <FunnelIcon size={14} className="shrink-0 text-kumo-subtle" />
          <Input
            size="sm"
            placeholder="Filter by IP, path, rule, or ASN..."
            aria-label="Filter events"
            className="w-72"
          />
          <Tabs
            variant="segmented"
            size="sm"
            tabs={[
              { value: "all", label: "All" },
              { value: "block", label: "Block" },
              { value: "challenge", label: "Challenge" },
              { value: "allow", label: "Allow" },
              { value: "log", label: "Log" },
            ]}
            selectedValue="all"
          />
        </div>
      </div>

      {/* Event list — scrolls behind sticky bar */}
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex flex-col gap-2">
          {SECURITY_EVENTS.map((evt, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-kumo-line bg-kumo-base px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    evt.action === "Block"
                      ? "error"
                      : evt.action === "Challenge"
                        ? "warning"
                        : "success"
                  }
                >
                  {evt.action}
                </Badge>
                <div>
                  <div className="text-sm font-medium text-kumo-default">
                    {evt.ip}
                  </div>
                  <div className="text-xs text-kumo-subtle">
                    {evt.method} {evt.path} — {evt.rule}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-kumo-subtle">{evt.country}</div>
                <div className="text-xs text-kumo-subtle">{evt.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SECURITY_EVENTS = Array.from({ length: 20 }, (_, i) => ({
  action: ["Block", "Challenge", "Allow", "Block", "Challenge"][i % 5],
  ip: `${103 + (i % 4)}.${21 + (i * 3) % 50}.${(i * 7) % 255}.${(i * 13) % 255}`,
  method: i % 3 === 0 ? "POST" : "GET",
  path: ["/api/login", "/wp-admin", "/api/users", "/.env", "/graphql"][i % 5],
  rule: ["WAF Rule #100", "Rate Limit", "Bot Score < 30", "IP Block", "Managed Rule"][i % 5],
  country: ["US", "CN", "DE", "RU", "BR", "IN", "GB", "JP"][i % 8],
  time: `${i + 1}m ago`,
}));

// ─── Layout: Full Takeover (Checkout style) ──────────────────────────

function FullTakeoverLayout() {
  return (
    <div className="flex h-full overflow-y-auto bg-kumo-base">
      <div className="m-auto w-full max-w-md px-6 py-8">
        {/* Back link */}
        <button className="mb-6 flex items-center gap-1.5 text-sm text-kumo-subtle hover:text-kumo-default">
          <ArrowLeftIcon size={14} />
          Back to Workers
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-kumo-default">
            Upgrade to Workers Paid
          </h1>
          <p className="mt-2 text-sm text-kumo-subtle">
            Unlock 10M requests/month, 30ms CPU time, and Durable Objects.
          </p>
        </div>

        {/* Plan summary */}
        <div className="mb-6 rounded-lg border border-kumo-line bg-kumo-elevated p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-kumo-default">Workers Paid</span>
            <span className="text-lg font-semibold text-kumo-default">
              $5<span className="text-sm font-normal text-kumo-subtle">/mo</span>
            </span>
          </div>
          <div className="mt-2 text-xs text-kumo-subtle">
            10M requests included, then $0.50/M
          </div>
        </div>

        {/* Payment form */}
        <div className="flex flex-col gap-3">
          <Input label="Cardholder Name" placeholder="Jane Doe" />
          <Input label="Card Number" placeholder="4242 4242 4242 4242" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry" placeholder="MM / YY" />
            <Input label="CVC" placeholder="123" />
          </div>
          <Button variant="primary" className="mt-3 w-full">
            Subscribe — $5/month
          </Button>
          <Button variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout: Worker Detail (sticky tabs + actions, hero, two-col) ────

function WorkerDetailLayout() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Breadcrumb header — scrolls away */}
      <div className="border-b border-kumo-line bg-kumo-base px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm">
          <TerminalIcon size={16} className="text-kumo-subtle" />
          <a className="text-kumo-brand hover:underline" href="#">
            Workers &amp; Pages
          </a>
          <span className="text-kumo-subtle">/</span>
          <span className="font-medium text-kumo-default">
            fragrant-heart-9525
          </span>
        </div>
      </div>

      {/* Sticky tab bar with action buttons */}
      <div className="sticky top-0 z-10 border-b border-kumo-line bg-kumo-base">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Tabs
            variant="underline"
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
            <Button variant="secondary" size="sm">
              <CodeIcon size={14} className="mr-1.5" />
              Edit code
            </Button>
            <Button variant="primary" size="sm">
              <GlobeSimpleIcon size={14} className="mr-1.5" />
              Visit
              <ArrowSquareOutIcon size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl p-6">
        {/* Deployment banner */}
        <div className="flex items-center justify-between rounded-lg border border-kumo-line bg-kumo-base px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <GlobeSimpleIcon size={16} className="text-kumo-brand" />
            <a className="font-medium text-kumo-brand hover:underline" href="#">
              fragrant-heart-9525.workers.dev
            </a>
            <span className="text-kumo-subtle">
              Automatic deployment on upload.
            </span>
          </div>
          <span className="text-xs text-kumo-subtle">
            by achintalapati · 36 minutes ago
          </span>
        </div>

        {/* Architecture diagram placeholder */}
        <div className="mt-4 rounded-lg border border-kumo-line bg-kumo-base p-6">
          <div className="flex items-center justify-center gap-8">
            {/* Domains */}
            <div className="w-40 rounded-lg border border-kumo-line p-3">
              <div className="text-xs font-medium text-kumo-default">
                Domains <Badge>1</Badge>
              </div>
            </div>
            {/* Connectors */}
            <div className="flex items-center gap-2 text-kumo-subtle">
              <div className="h-px w-8 bg-kumo-line" />
              <span className="text-xs">→</span>
              <div className="h-px w-8 bg-kumo-line" />
            </div>
            {/* Worker */}
            <div className="rounded-lg border-2 border-kumo-brand/30 bg-kumo-tint p-4">
              <div className="flex items-center gap-2">
                <TerminalIcon size={16} className="text-kumo-brand" />
                <span className="text-sm font-medium text-kumo-default">
                  fragrant-heart-9525
                </span>
                <div className="size-2 rounded-full bg-kumo-success" />
              </div>
              <div className="mt-2 text-xs text-kumo-subtle">
                Workers Logs: Enabled
              </div>
            </div>
            {/* Connectors */}
            <div className="flex items-center gap-2 text-kumo-subtle">
              <div className="h-px w-8 bg-kumo-line" />
              <span className="text-xs">→</span>
              <div className="h-px w-8 bg-kumo-line" />
            </div>
            {/* Bindings */}
            <div className="w-40 rounded-lg border border-kumo-line p-3">
              <div className="text-xs font-medium text-kumo-default">
                Bindings <Badge>0</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column: metrics left, domains right */}
        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_280px]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Metrics */}
            <div className="rounded-lg border border-kumo-line bg-kumo-base">
              <div className="flex items-center justify-between border-b border-kumo-line px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-kumo-default">
                  Metrics
                  <Badge>Last 24 hours</Badge>
                </div>
                <span className="text-xs text-kumo-brand">→</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-kumo-line">
                <div className="p-4">
                  <div className="text-xs text-kumo-subtle">Requests</div>
                  <div className="mt-1 text-xl font-semibold text-kumo-default">
                    1,247
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-kumo-subtle">Errors</div>
                  <div className="mt-1 text-xl font-semibold text-kumo-default">
                    3
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-kumo-subtle">CPU Time</div>
                  <div className="mt-1 text-xl font-semibold text-kumo-default">
                    2.4<span className="text-sm font-normal text-kumo-subtle"> ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <PlaceholderCard title="Request Distribution & Placement" height={200} />

            {/* Versions */}
            <PlaceholderCard title="Versions" height={120} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-kumo-line bg-kumo-base">
              <div className="flex items-center justify-between border-b border-kumo-line px-4 py-2.5">
                <span className="text-sm font-medium text-kumo-default">
                  Domains &amp; Routes
                </span>
                <span className="text-xs text-kumo-brand">→</span>
              </div>
              <div className="divide-y divide-kumo-hairline p-4 text-sm">
                <div className="pb-3">
                  <div className="text-xs text-kumo-subtle">workers.dev</div>
                  <div className="mt-0.5 truncate text-kumo-default">
                    fragrant-heart-9525.workers.dev
                  </div>
                </div>
                <div className="py-3">
                  <div className="text-xs text-kumo-subtle">
                    Custom domains
                  </div>
                  <div className="mt-0.5 text-kumo-subtle">—</div>
                </div>
                <div className="pt-3">
                  <div className="text-xs text-kumo-subtle">Routes</div>
                  <div className="mt-0.5 text-kumo-subtle">—</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-kumo-line bg-kumo-base">
              <div className="border-b border-kumo-line px-4 py-2.5 text-sm font-medium text-kumo-default">
                Next Steps
              </div>
              <div className="divide-y divide-kumo-hairline">
                {[
                  {
                    title: "Connect a custom domain",
                    desc: "Serve your worker from your own domain.",
                  },
                  {
                    title: "Automate your CI",
                    desc: "Connect your Git repository.",
                  },
                  {
                    title: "Store your data",
                    desc: "Connect KV, D1, or R2 storage.",
                  },
                ].map((step) => (
                  <div
                    key={step.title}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-kumo-default">
                        {step.title}
                      </div>
                      <div className="text-xs text-kumo-subtle">
                        {step.desc}
                      </div>
                    </div>
                    <span className="text-xs text-kumo-brand">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared: Page Header ──────────────────────────────────────────────

/**
 * Reusable page header with title, description, optional icon,
 * right-aligned actions, and tabs. Mirrors the stratus PageHeader block.
 */
function DemoPageHeader({
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
    <div>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 text-kumo-subtle">{icon}</div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-kumo-default">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-kumo-subtle">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && (
        <div className="mt-4">
          <Tabs
            variant="segmented"
            size="sm"
            tabs={tabs.map((t) => ({
              value: t.toLowerCase().replace(/\s/g, "-"),
              label: t,
            }))}
            selectedValue={
              selectedTab ?? tabs[0]?.toLowerCase().replace(/\s/g, "-")
            }
          />
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────

function PlaceholderCard({
  title,
  height,
}: {
  title: string;
  height: number;
}) {
  return (
    <div
      className="rounded-lg border border-kumo-line bg-kumo-base p-4"
      style={{ height }}
    >
      <div className="text-xs font-medium text-kumo-subtle">{title}</div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-kumo-brand/10"
            style={{
              height: Math.max(8, Math.sin(i * 0.5) * 30 + 40 + Math.random() * 20),
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  const isGood = positive ?? change.startsWith("-");
  return (
    <div className="rounded-lg border border-kumo-line bg-kumo-base p-4">
      <div className="text-xs text-kumo-subtle">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-semibold tabular-nums text-kumo-default">
          {value}
        </span>
        <span
          className={`text-xs font-medium ${isGood ? "text-kumo-success" : "text-kumo-danger"}`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}

function UsageRow({
  label,
  used,
  limit,
  percent,
}: {
  label: string;
  used: string;
  limit: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-kumo-subtle">{label}</span>
        <span className="font-medium text-kumo-default">
          {used}{" "}
          <span className="font-normal text-kumo-subtle">/ {limit}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-kumo-fill">
        <div
          className={`h-full rounded-full ${percent > 80 ? "bg-kumo-danger" : "bg-kumo-brand"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
