import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  Sidebar,
  Tabs,
  Badge,
  Button,
  LinkButton,
  Input,
  CloudflareLogo,
  DropdownMenu,
} from "@cloudflare/kumo";
import {
  HouseIcon,
  GearIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  GlobeIcon,
  GlobeSimpleIcon,
  LockIcon,
  TerminalIcon,
  HardDrivesIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CodeIcon,
  ListIcon,
  PlayIcon,
  DotsThreeIcon,
  MagnifyingGlassIcon,
  ClockCounterClockwiseIcon,
  SparkleIcon,
  LightningIcon,
  NetworkIcon,
  ShieldStarIcon,
  FileTextIcon,
  SunIcon,
  MoonIcon,
  WarningIcon,
  InfoIcon,
  CheckCircleIcon,
  XIcon,
} from "@phosphor-icons/react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE CHROME PRIMITIVES
//
// These are the official building blocks for page layout. Every page
// composes from this same set. The rules:
//
//   1. PageChrome    → white bar, breadcrumbs + actions. Always present.
//   2. PageTabs      → underline tabs for page-level navigation. Optional.
//   4. PageContent   → gray canvas. Cards (white) sit on top.
//   5. Card          → white surface for content sections.
//
// Chrome is flush edge-to-edge. No max-width constraints — content
// fills the available space. No hero titles. No description blocks.
// The sidebar provides context; the breadcrumb confirms location.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** White top bar. Breadcrumbs left, page actions + global actions right.
 *  Pass `sticky` on layouts without `PageTabs` so the chrome stays pinned. */
function PageChrome({
  breadcrumbs,
  actions,
  sticky,
  breadcrumbsHidden,
}: {
  breadcrumbs: { icon?: ReactNode; label: string; active?: boolean }[];
  actions?: ReactNode;
  sticky?: boolean;
  /** Fade the breadcrumb trail out (e.g. while a PageHero with the same
   *  title is on-screen). Toggle to `false` to fade it back in. */
  breadcrumbsHidden?: boolean;
}) {
  return (
    <div className={`${sticky ? "sticky top-0 z-20 " : ""}flex h-14 shrink-0 items-center justify-between gap-3 border-b border-kumo-line bg-kumo-base px-5`}>
      <Sidebar.Trigger className="md:hidden" aria-label="Open navigation">
        <ListIcon size={18} weight="bold" />
      </Sidebar.Trigger>
      <nav
        className={`flex flex-1 min-w-0 items-center gap-1.5 text-base transition-opacity duration-300 ${breadcrumbsHidden ? "opacity-0" : "opacity-100"}`}
        aria-hidden={breadcrumbsHidden}
      >
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

/** Toggles `data-mode` between light and dark on `<html>`. */
function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light";
  });
  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-mode", next);
    setMode(next);
  };
  const Icon = mode === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="flex size-7 items-center justify-center rounded-md text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default"
    >
      <Icon size={14} />
    </button>
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
      <ThemeToggle />
      <button className="flex size-7 items-center justify-center rounded-full bg-kumo-tint text-xs font-medium text-kumo-default">
        M
      </button>
    </div>
  );
}

/**
 * Segmented tabs for page-level navigation. Tabs scroll horizontally on
 * overflow. Pass any composed JSX as `actions` — Button, LinkButton,
 * DropdownMenu, etc. — to sit on the trailing edge.
 */
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
    <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-kumo-line bg-kumo-base/75 px-5 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <Tabs
          variant="segmented"
          tabs={tabs.map((t) => ({
            value: t.toLowerCase().replace(/\s/g, "-"),
            label: t,
          }))}
          selectedValue={selected ?? tabs[0]?.toLowerCase().replace(/\s/g, "-")}
        />
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Hero block. Non-sticky; sits flush above content.
 *  `decorated` (default true) layers: a soft top-edge sheen + radial light
 *  source from the top-left + a fine dot grid that fades into the right.
 *  Set `decorated={false}` for flat nested heroes. */
function PageHero({
  icon,
  title,
  tagline,
  actions,
  decorated = true,
}: {
  icon?: ReactNode;
  title: string;
  tagline?: string;
  actions?: ReactNode;
  decorated?: boolean;
}) {
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-kumo-line bg-kumo-base">
      {decorated && (
        <>
          {/* Dark → darker diagonal gradient (base into recessed) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kumo-base via-kumo-base to-kumo-recessed"
          />
          {/* Faint dot grid on top */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--color-kumo-line)_1px,transparent_0)] [background-size:22px_22px] opacity-30"
          />
        </>
      )}
      <div className="relative flex items-start md:items-center justify-between gap-4 px-5 py-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-kumo-default">{icon}</span>}
            <h1 className="text-2xl font-bold tracking-tight text-kumo-default">
              {title}
            </h1>
          </div>
          {tagline && (
            <p className="mt-1.5 text-sm text-kumo-subtle">{tagline}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col md:flex-row gap-2 *:w-full *:justify-center md:*:w-auto md:*:justify-start">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact full-width banner for page-level announcements. Edge-to-edge,
 * sits above PageContent. Variants & color semantics match Kumo's Banner
 * component: `default` (info), `alert` (warning), `error` (danger).
 */
function PageBanner({
  variant = "default",
  icon,
  children,
  action,
  onDismiss,
}: {
  variant?: "default" | "alert" | "error";
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}) {
  const variants: Record<string, string> = {
    default: "bg-kumo-info-tint/30 border-kumo-info/50 text-kumo-info selection:bg-kumo-info",
    alert: "bg-kumo-warning-tint/15 border-kumo-warning/50 text-kumo-warning selection:bg-kumo-warning",
    error: "bg-kumo-danger-tint/15 border-kumo-danger/50 text-kumo-danger selection:bg-kumo-danger",
  };
  const defaultIcons: Record<string, ReactNode> = {
    default: <InfoIcon size={14} weight="fill" />,
    alert: <WarningIcon size={14} weight="fill" />,
    error: <WarningIcon size={14} weight="fill" />,
  };
  return (
    <div className="shrink-0 bg-kumo-base">
      <div className={`flex items-center gap-2 border-b px-5 py-2 text-sm ${variants[variant]}`}>
        <span className="shrink-0">{icon ?? defaultIcons[variant]}</span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {action && <span className="shrink-0">{action}</span>}
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-black/10"
          >
            <XIcon size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Viewport-locked frame. Fills the remaining vertical space below the page
 * chrome and clamps its contents to that height — children that need to scroll
 * do so internally, never the page. Pure composition: arrange whatever you
 * want inside (single card, split, sidebar + main, multiple stacked cards).
 * Direct flex children inherit the clamped height; mark scrolling regions
 * with `min-h-0 overflow-y-auto`.
 */
function PageViewport({
  children,
  padded = true,
  className,
}: {
  children: ReactNode;
  /** Inset contents from the page edges. Set false for flush layouts. */
  padded?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex min-h-0 flex-1 gap-4 ${padded ? "p-4" : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}

/**
 * Gray canvas. Lays content out in a CSS grid with a centered, max-width
 * `content` track. Default children sit in the content track; wrap a child in
 * `<PageContent.Bleed>` to break out and span the full canvas width.
 */
function PageContentRoot({
  children,
  className,
  maxWidth = "1200px",
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div
      style={{ "--page-content-max": maxWidth } as CSSProperties}
      className={`grid grid-cols-[minmax(1.25rem,1fr)_minmax(0,var(--page-content-max))_minmax(1.25rem,1fr)] gap-y-3 py-5 [&>*]:col-start-2 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function PageContentBleed({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`!col-span-full !col-start-1 ${className ?? ""}`}>{children}</div>;
}

const PageContent = Object.assign(PageContentRoot, { Bleed: PageContentBleed });

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
      className="flex items-center justify-center rounded-lg bg-kumo-base text-xs text-kumo-subtle ring ring-kumo-line"
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
  | "nested-hero"
  | "full-takeover"
  | "worker-detail";

const VARIANTS: { value: LayoutVariant; label: string }[] = [
  { value: "scrolling", label: "Scrolling" },
  { value: "viewport-locked", label: "Locked" },
  { value: "two-column", label: "Two-Col" },
  { value: "nested-hero", label: "Nested" },
  { value: "full-takeover", label: "Takeover" },
  { value: "worker-detail", label: "Detail" },
];

const VARIANT_DESC: Record<LayoutVariant, string> = {
  scrolling: "Body scrolls. Most settings and list pages.",
  "viewport-locked": "Content fills viewport. Inner scroll regions.",
  "two-column": "Main + sticky sidebar. Resource overviews.",
  "nested-hero": "Hero under tabs (no chrome). Sub-section landing.",
  "full-takeover": "Centered form. Checkout and onboarding.",
  "worker-detail": "Breadcrumb + sticky tabs + actions. Detail pages.",
};

const VARIANT_SNIPPETS: Record<LayoutVariant, string> = {
  scrolling: `PageChrome
  └ breadcrumbs:  DNS › example.com

PageTabs                                  ── sticky
  ├ tabs:         Records · Analytics · Settings
  └ actions:      Button "Documentation"

PageBanner                                ── alert · dismissible
  └ "DNSSEC partially configured…"

PageContent                               ── scrolls
  ├ Card  "Search + Add Record toolbar"
  ├ Card  "DNS records table"
  ├ Card  "DNSSEC"
  └ … more sections`,

  "viewport-locked": `PageChrome
  └ breadcrumbs:  Workers › fragrant-heart-9525 › Logs

PageViewport                              ── clamps to remaining height
  └ <your composition>                    ── e.g. card · split · sidebar
       ├ header bar         (shrink-0)
       └ scrolling region   (min-h-0 overflow-y-auto)`,

  "nested-hero": `PageChrome
  └ breadcrumbs:  Observability › Destinations

PageTabs                                  ── sticky
  └ tabs:         Overview · Queries · Traces · Destinations*

PageHero  decorated={false}               ── flat bg, no dot grid
  ├ title:        Observability Destinations
  ├ tagline:      Configure endpoints to send…
  └ actions:      View docs ↗ · + Add Destination

PageContent                               ── scrolls
  └ Card  ── empty state · CTA`,

  "two-column": `PageChrome                                ── sticky
  └ breadcrumbs:  Workers & Pages

PageHero                                  ── dot-grid bg, scrolls away
  ├ icon · title · tagline
  └ actions:      Documentation · Create application

PageContent                               ── scrolls
  ├ main column
  │   ├ Card  "Search + Create toolbar"
  │   └ Card  "Dispatch namespaces table"
  └ aside (280px)
      ├ Card  "Usage metrics"
      └ Card  "Next Steps"`,

  "full-takeover": `(no chrome — full takeover)

centered <main> · max-w-md
  ├ BackLink   "Back to Workers"
  ├ Title      "Upgrade to Workers Paid"
  ├ Card       "Plan summary"
  ├ Card       "Payment form"
  └ actions    Subscribe · Cancel`,

  "worker-detail": `PageChrome
  └ breadcrumbs:  Workers & Pages › fragrant-heart-9525

PageTabs                                  ── sticky · scrolls horizontally
  ├ tabs:         Overview · Metrics · Deployments · …
  └ actions:      Edit code · Visit ↗ (LinkButton)

PageContent                               ── scrolls
  ├ Card        "Deployment banner"
  ├ Card        "Architecture diagram"
  └ grid  [ 1fr | 280px ]
       ├ main:   Metrics · Versions · Logs · …
       └ aside:  Domains · Bindings · Triggers · …`,
};

/** Bottom-right toggle that swaps the live page for its composition snippet. */
function CodePeek({ variant }: { variant: LayoutVariant }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-kumo-recessed/95 p-6 backdrop-blur-sm">
          <pre className="mx-auto max-w-3xl whitespace-pre rounded-lg bg-kumo-base p-6 font-mono text-[13px] leading-6 text-kumo-default ring ring-kumo-line">
            {VARIANT_SNIPPETS[variant]}
          </pre>
        </div>
      )}
      <div className="absolute bottom-4 right-4 z-40">
        <Button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-pressed={open}
        >
          <CodeIcon size={14} weight="bold" />
          {open ? "Show page" : "Show code"}
        </Button>
      </div>
    </>
  );
}

const PortalContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export function PageLayoutDemo() {
  const [variant, setVariant] = useState<LayoutVariant>("scrolling");
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <PortalContainerContext.Provider value={rootRef}>
      <div ref={rootRef} className="isolate flex h-screen flex-col">
        {/* Demo-only: variant switcher */}
        <div className="flex shrink-0 items-center justify-between border-b border-kumo-line bg-kumo-base px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-kumo-default">Layout:</span>
            <Tabs
              variant="segmented"
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
              {variant === "nested-hero" && <NestedHeroLayout />}
              {variant === "full-takeover" && <FullTakeoverLayout />}
              {variant === "worker-detail" && <WorkerDetailLayout />}
            </div>
            <CodePeek variant={variant} />
          </main>
        </Sidebar.Provider>
      </div>
    </PortalContainerContext.Provider>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIDEBAR (shared dashboard chrome)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DashSidebar({ activeVariant }: { activeVariant: LayoutVariant }) {
  const computeActive = ["two-column", "viewport-locked", "worker-detail"].includes(activeVariant);
  return (
    <Sidebar>
      <Sidebar.Header className="h-14">
        <div className="flex items-center gap-2 px-1">
          <CloudflareLogo variant="glyph" className="size-5 shrink-0" />
          <span className="truncate text-sm font-semibold text-kumo-default group-data-[state=collapsed]/sidebar:hidden">
            Hello@mattrothenberg.com
          </span>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <div className="px-1 group-data-[state=collapsed]/sidebar:hidden">
            <Button variant="secondary" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <MagnifyingGlassIcon size={14} />
                Quick search…
              </span>
              <span className="text-xs text-kumo-subtle">⌘K</span>
            </Button>
          </div>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton icon={HouseIcon} active={activeVariant === "scrolling"} tooltip="Account home">
              Account home
            </Sidebar.MenuButton>
            <Sidebar.MenuButton icon={ClockCounterClockwiseIcon} tooltip="Recents">Recents</Sidebar.MenuButton>
            <Sidebar.MenuButton icon={GlobeIcon} tooltip="Domains">Domains</Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Observe</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton icon={FileTextIcon} tooltip="Investigate">Investigate</Sidebar.MenuButton>
              <Sidebar.MenuButton icon={ChartBarIcon} tooltip="Analytics">Analytics</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Build</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton icon={TerminalIcon} active={computeActive} tooltip="Compute">
                Compute
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={SparkleIcon} tooltip="AI">AI</Sidebar.MenuButton>
              <Sidebar.MenuButton icon={HardDrivesIcon} tooltip="Storage & databases">
                Storage &amp; databases
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={PlayIcon} tooltip="Media">Media</Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Group collapsible defaultOpen>
          <Sidebar.GroupLabel>Protect &amp; Connect</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuButton icon={ShieldCheckIcon} tooltip="Application security">
                Application security
              </Sidebar.MenuButton>
              <Sidebar.MenuButton icon={ShieldStarIcon} tooltip="Zero Trust">Zero Trust</Sidebar.MenuButton>
              <Sidebar.MenuButton icon={NetworkIcon} tooltip="Networking">Networking</Sidebar.MenuButton>
              <Sidebar.MenuButton icon={LightningIcon} tooltip="Delivery & performance">
                Delivery &amp; performance
              </Sidebar.MenuButton>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
        <Sidebar.Separator />
        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton icon={GearIcon} active={activeVariant === "full-takeover"} tooltip="Manage account">
              Manage account
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
  const [bannerOpen, setBannerOpen] = useState(true);
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
        actions={<Button variant="secondary">Documentation</Button>}
      />
      {bannerOpen && (
        <PageBanner
          variant="alert"
          action={
            <Button variant="secondary" size="sm">
              Review changes
            </Button>
          }
          onDismiss={() => setBannerOpen(false)}
        >
          DNSSEC is partially configured. Activate at the registrar to complete the chain of trust.
        </PageBanner>
      )}
      <PageContent>
        <div className="flex flex-col gap-3">
          <Card height={48} label="Search + Add Record toolbar" />
          <Card height={520} label="DNS records table" />
          <Card height={140} label="DNSSEC" />
          <Card height={120} label="Custom Nameservers" />
          <Card height={140} label="DNS Settings" />
          <Card height={180} label="Email routing" />
          <Card height={140} label="Zone holds" />
          <Card height={200} label="Migration & exports" />
          <Card height={160} label="API tokens scoped to this zone" />
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
      <PageViewport>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-kumo-base ring ring-kumo-line">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-kumo-line px-3 py-2">
            <div className="flex items-center gap-2">
              <Input size="sm" placeholder="Filter logs..." aria-label="Filter" className="w-48" />
              <Tabs
                variant="segmented"
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
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col">
              {Array.from({ length: 40 }, (_, i) => (
                <div
                  key={i}
                  className="flex h-9 items-center gap-3 border-b border-kumo-line px-3 last:border-b-0"
                >
                  <div className="h-2 w-16 shrink-0 rounded bg-kumo-tint" />
                  <div className="h-2 w-24 shrink-0 rounded bg-kumo-tint" />
                  <div className="h-2 flex-1 rounded bg-kumo-tint" />
                  <div className="h-2 w-12 shrink-0 rounded bg-kumo-tint" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageViewport>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const root = scrollRef.current;
    const target = heroRef.current;
    if (!root || !target) return;
    // Shrink the observation area by the sticky chrome height (h-14 = 56px)
    // so "intersecting" means the hero is in the visible region *below* the
    // chrome — fade fires the instant the hero's bottom passes the chrome.
    const io = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { root, rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={scrollRef} className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        sticky
        breadcrumbsHidden={heroVisible}
        breadcrumbs={[
          { icon: <TerminalIcon size={16} />, label: "Workers & Pages", active: true },
        ]}
      />
      <div ref={heroRef}>
        <PageHero
          icon={<TerminalIcon size={28} weight="fill" />}
          title="Workers & Pages"
          tagline="Build & deploy serverless functions, sites, and full-stack applications."
          actions={
            <>
              <Button variant="secondary" size="sm">Documentation</Button>
              <Button variant="primary" size="sm">Create application</Button>
            </>
          }
        />
      </div>
      <PageContent>
        <div className="flex gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Card height={48} label="Search + Create toolbar" />
            <Card height={520} label="Dispatch namespaces table" />
            <Card height={220} label="Recently deployed" />
            <Card height={180} label="Saved deployments" />
            <Card height={240} label="Archived applications" />
          </div>
          <div className="hidden w-[280px] shrink-0 lg:block">
            <div className="flex flex-col gap-3">
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT: Nested Hero (sub-section landing inside a tab)
//
// Pattern: chrome → tabs → un-decorated PageHero → content with empty state
// Used by: Observability › Destinations, any tab-rooted sub-page where
// the section deserves a hero but isn't the top-of-product entry point.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NestedHeroLayout() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageChrome
        breadcrumbs={[
          { icon: <ChartBarIcon size={16} />, label: "Observability" },
          { label: "Destinations", active: true },
        ]}
      />
      <PageTabs
        tabs={["Overview", "Queries", "Traces", "Destinations"]}
        selected="destinations"
      />
      <PageHero
        decorated={false}
        title="Observability Destinations"
        tagline="Configure endpoints to send trace data to observability platforms."
        actions={
          <>
            <LinkButton variant="secondary" size="sm" href="https://example.com" target="_blank" rel="noopener noreferrer">
              View docs
              <ArrowSquareOutIcon size={12} />
            </LinkButton>
            <Button variant="primary" size="sm">+ Add Destination</Button>
          </>
        }
      />
      <PageContent>
        <Card height={420}>
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <SparkleIcon size={28} className="text-kumo-subtle" />
            <div className="text-base font-semibold text-kumo-default">
              No observability destinations configured
            </div>
            <p className="max-w-md text-sm text-kumo-subtle">
              Create your first destination to start sending trace and log data
              to external observability platforms.
            </p>
            <Button variant="primary" size="sm">+ Add Destination</Button>
          </div>
        </Card>
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
    <div className="relative flex h-full overflow-y-auto bg-kumo-base">
      {/* Subtle dot grid across canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,var(--color-kumo-line)_1px,transparent_0)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,transparent,black_90%)]"
      />
      <div className="relative m-auto w-full max-w-md px-6 py-8">
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
          <Button variant="primary" className="w-full justify-center">Subscribe — $5/month</Button>
          <Button variant="outline" className="w-full justify-center">Cancel</Button>
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
            <Button variant="secondary">
              <CodeIcon size={14} />
              Edit code
            </Button>
            <LinkButton variant="primary" href="https://example.com" target="_blank" rel="noopener noreferrer">
              <GlobeSimpleIcon size={14} />
              Visit
              <ArrowSquareOutIcon size={12} />
            </LinkButton>
          </>
        }
      />
      <PageContent>
        <div className="flex flex-col gap-3">
          <Card height={44} label="Deployment banner" />
          <Card height={200} label="Architecture diagram (Domains → Worker → Bindings)" />
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-3">
              <Card height={140} label="Metrics: Requests · Errors · CPU Time" />
              <Card height={260} label="Request Distribution & Placement map" />
              <Card height={140} label="Versions" />
              <Card height={220} label="Recent invocations" />
              <Card height={200} label="Logs preview" />
              <Card height={180} label="Build history" />
            </div>
            <div className="flex flex-col gap-3">
              <Card height={180} label="Domains & Routes" />
              <Card height={200} label="Next Steps" />
              <Card height={140} label="Bindings" />
              <Card height={140} label="Triggers" />
              <Card height={160} label="Secrets" />
            </div>
          </div>
        </div>
      </PageContent>
    </div>
  );
}
