import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bot,
  CandlestickChart,
  Check,
  ExternalLink,
  History,
  Megaphone,
  Moon,
  PieChart,
  Radar,
  RotateCcw,
  ShieldAlert,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import {
  BONK_MINT,
  allChecks,
  hostOf,
  isSolanaAddress,
  phases,
  shortAddress,
  type LinkTarget,
  type Phase,
  type ToolCard,
  type ToolContext,
} from "@/lib/checklist-data";
import { lookupToken, type TokenSnapshot } from "@/lib/token-lookup";

const STORAGE_KEY = "meme-master-checklist-v1";

const ICONS: Record<string, LucideIcon> = {
  rugcheck: ShieldAlert,
  bubblemaps: Waypoints,
  gmgn: History,
  dexscreener: CandlestickChart,
  kolscan: Megaphone,
  arkham: Radar,
  cielo: Bell,
  copyfomo: Bot,
  birdeye: PieChart,
  logoff: Moon,
};

type Persisted = {
  mint: string;
  wallet: string;
  loadedMint: string;
  loadedWallet: string;
  checked: string[];
};

const EMPTY: Persisted = {
  mint: "",
  wallet: "",
  loadedMint: "",
  loadedWallet: "",
  checked: [],
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lamp";

function readStore(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const rec = parsed as Record<string, unknown>;
    const checked = Array.isArray(rec.checked)
      ? rec.checked.filter((id): id is string => typeof id === "string")
      : [];
    return {
      mint: typeof rec.mint === "string" ? rec.mint : "",
      wallet: typeof rec.wallet === "string" ? rec.wallet : "",
      loadedMint: typeof rec.loadedMint === "string" ? rec.loadedMint : "",
      loadedWallet: typeof rec.loadedWallet === "string" ? rec.loadedWallet : "",
      checked,
    };
  } catch {
    return EMPTY;
  }
}

function pullAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isSolanaAddress(trimmed)) return trimmed;
  const match = trimmed.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (match && isSolanaAddress(match[0])) return match[0];
  return null;
}

function formatUsd(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  if (abs >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(2)}`;
}

function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function ChecklistApp() {
  const [store, setStore] = useState<Persisted>(EMPTY);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<TokenSnapshot | null>(null);
  const [snapshotNote, setSnapshotNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const saved = readStore();
    setStore(saved);
    setReady(true);
    if (saved.loadedMint) {
      const id = ++requestId.current;
      void fetchSnapshot(saved.loadedMint, id);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, ready]);

  const checked = new Set(store.checked);
  const done = allChecks.filter((item) => checked.has(item.id)).length;
  const total = allChecks.length;
  const ctx: ToolContext = {
    mint: store.loadedMint,
    wallet: store.loadedWallet,
    pairUrl: snapshot?.pairUrl ?? null,
  };

  async function fetchSnapshot(mint: string, id: number) {
    try {
      const snap = await lookupToken({ data: mint });
      if (id !== requestId.current) return;
      setSnapshot(snap);
      setSnapshotNote(
        snap ? null : "No DexScreener pair yet. The tool links still use this mint.",
      );
    } catch {
      if (id !== requestId.current) return;
      setSnapshot(null);
      setSnapshotNote("Market snapshot didn’t load. The tool links still updated.");
    }
  }

  async function load(rawMint: string, rawWallet: string) {
    const mint = pullAddress(rawMint);
    const wallet = pullAddress(rawWallet);
    if (mint === null) {
      setFieldError("That doesn’t look like a Solana mint. Paste the contract address.");
      return;
    }
    if (wallet === null) {
      setFieldError("That doesn’t look like a Solana wallet address.");
      return;
    }
    if (!mint && !wallet) {
      setFieldError("Paste a token mint, a wallet, or both.");
      return;
    }
    setFieldError(null);
    setCopied(false);
    const id = ++requestId.current;
    setStore((prev) => ({
      ...prev,
      mint,
      wallet,
      loadedMint: mint,
      loadedWallet: wallet,
    }));
    if (!mint) {
      setSnapshot(null);
      setSnapshotNote(null);
      setLoading(false);
      return;
    }
    setSnapshot(null);
    setSnapshotNote(null);
    setLoading(true);
    await fetchSnapshot(mint, id);
    if (id === requestId.current) setLoading(false);
  }

  function toggle(id: string) {
    setStore((prev) => {
      const has = prev.checked.includes(id);
      return {
        ...prev,
        checked: has ? prev.checked.filter((item) => item !== id) : [...prev.checked, id],
      };
    });
  }

  function clearChecks() {
    setStore((prev) => ({ ...prev, checked: [] }));
  }

  async function copyMint() {
    if (!store.loadedMint) return;
    try {
      await navigator.clipboard.writeText(store.loadedMint);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-lamp">3am desk</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-fg sm:text-5xl">
            Meme Master Checklist
          </h1>
        </div>
        <p className="shrink-0 text-right">
          <span className="font-display text-3xl tabular-nums leading-none text-fg">
            {done}
            <span className="text-faint">/{total}</span>
          </span>
          <span className="mt-1 block text-xs text-faint">checked</span>
        </p>
      </header>

      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        The exact tabs from the 0xNevsky post, in order. Paste a mint, load the tools, and tick
        the boxes as you go.
      </p>
      <p className="mt-2 font-display text-lg italic leading-snug text-fg">
        “Bookmark this. You’ll need it at 3am.”
      </p>

      <div className="mt-5 flex gap-1" aria-hidden="true">
        {allChecks.map((item) => (
          <span
            key={item.id}
            className={
              checked.has(item.id)
                ? "h-1.5 flex-1 rounded-full bg-lamp"
                : "h-1.5 flex-1 rounded-full bg-line"
            }
          />
        ))}
      </div>
      <p className="sr-only">
        {done} of {total} checks complete
      </p>

      <form
        className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void load(store.mint, store.wallet);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-sm text-muted">Solana token mint</span>
            <input
              value={store.mint}
              onChange={(event) => {
                setStore((prev) => ({ ...prev, mint: event.target.value }));
                setFieldError(null);
              }}
              placeholder="Paste a contract address"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              className={`min-h-12 w-full rounded-xl border border-line bg-bg px-3 font-mono text-base text-fg outline-none placeholder:font-sans placeholder:text-faint focus:border-lamp ${focusRing}`}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-lamp px-5 font-medium text-ink disabled:opacity-60 ${focusRing}`}
          >
            {loading ? "Loading…" : "Load tools"}
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm text-muted">
            Wallet <span className="text-faint">optional — whale or yours</span>
          </span>
          <input
            value={store.wallet}
            onChange={(event) => {
              setStore((prev) => ({ ...prev, wallet: event.target.value }));
              setFieldError(null);
            }}
            placeholder="For Arkham, Cielo, and Birdeye PnL"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            className={`min-h-12 w-full rounded-xl border border-line bg-bg px-3 font-mono text-base text-fg outline-none placeholder:font-sans placeholder:text-faint focus:border-lamp ${focusRing}`}
          />
        </label>

        {fieldError ? (
          <p role="alert" className="mt-3 text-sm text-warn">
            {fieldError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => void load(BONK_MINT, "")}
            className={`min-h-11 text-sm text-muted underline-offset-4 hover:text-fg hover:underline ${focusRing}`}
          >
            Load BONK as a demo mint
          </button>
          <button
            type="button"
            onClick={clearChecks}
            disabled={done === 0}
            className={`inline-flex min-h-11 items-center gap-2 text-sm text-muted disabled:opacity-40 ${focusRing}`}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear checks
          </button>
        </div>

        <LoadedStatus
          mint={store.loadedMint}
          wallet={store.loadedWallet}
          snapshot={snapshot}
          note={snapshotNote}
          loading={loading}
          copied={copied}
          onCopy={() => void copyMint()}
        />
      </form>

      <nav aria-label="Phases" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {phases.map((phase) => {
          const phaseTotal = phase.tools.reduce((sum, tool) => sum + tool.checks.length, 0);
          const phaseDone = phase.tools.reduce(
            (sum, tool) => sum + tool.checks.filter((item) => checked.has(item.id)).length,
            0,
          );
          return (
            <a
              key={phase.id}
              href={`#phase-${phase.id}`}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm text-fg ${focusRing}`}
            >
              <span className="font-display italic text-lamp">{phase.index}</span>
              {phase.title}
              <span className="tabular-nums text-faint">
                {phaseDone}/{phaseTotal}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="mt-8 flex flex-col gap-10">
        {phases.map((phase) => (
          <PhaseBlock
            key={phase.id}
            phase={phase}
            ctx={ctx}
            checked={checked}
            onToggle={toggle}
          />
        ))}
      </div>

      {done === total ? (
        <p className="mt-10 font-display text-2xl leading-snug text-fg">
          All eleven are ticked. If you are down, the last step was to log off.
        </p>
      ) : null}

      <footer className="mt-10 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-xl text-fg">Not a trade</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Research checklist only. This is not a trading bot and not financial advice. Memecoins
          are extremely high-risk — most people lose money. The hostname sits next to every
          link so you can confirm the real site before you connect a wallet. Never risk more
          than you can afford to lose completely.
        </p>
        <p className="mt-3 text-sm text-faint">
          Steps follow{" "}
          <a
            href="https://x.com/0xNevsky/status/2108229980257964500"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-lamp underline-offset-4 hover:underline ${focusRing}`}
          >
            0xNevsky, 8 Oct 2026
          </a>
          . Not affiliated with any of these tools.
          {ready ? " Checks are saved in this browser." : null}
        </p>
      </footer>
    </main>
  );
}

function LoadedStatus({
  mint,
  wallet,
  snapshot,
  note,
  loading,
  copied,
  onCopy,
}: {
  mint: string;
  wallet: string;
  snapshot: TokenSnapshot | null;
  note: string | null;
  loading: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  if (!mint && !wallet) {
    return (
      <p className="mt-4 text-sm text-faint">
        Rugcheck, Bubblemaps, GMGN, DexScreener, and Birdeye stay on their homepages until you
        load a mint.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-bg p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 font-display text-xl text-fg">
          {snapshot ? (
            <>
              {snapshot.symbol}
              <span className="ml-2 font-sans text-sm text-muted">{snapshot.name}</span>
            </>
          ) : mint ? (
            "Mint loaded"
          ) : (
            "Wallet loaded"
          )}
        </p>
        {mint ? (
          <button
            type="button"
            onClick={onCopy}
            className={`min-h-11 text-sm text-lamp ${focusRing}`}
          >
            {copied ? "Copied" : "Copy mint"}
          </button>
        ) : null}
      </div>
      <p className="mt-1 break-all font-mono text-sm text-faint">
        {mint ? shortAddress(mint) : null}
        {mint && wallet ? " · " : null}
        {wallet ? `wallet ${shortAddress(wallet)}` : null}
      </p>
      {snapshot ? (
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Price" value={formatUsd(snapshot.priceUsd)} />
          <Stat
            label="24h"
            value={formatPct(snapshot.change24h)}
            tone={
              snapshot.change24h == null
                ? "plain"
                : snapshot.change24h < 0
                  ? "down"
                  : "up"
            }
          />
          <Stat label="Liquidity" value={formatUsd(snapshot.liquidityUsd)} />
        </dl>
      ) : null}
      {loading ? (
        <p className="mt-3 text-sm text-muted">Reading the market snapshot…</p>
      ) : note ? (
        <p className="mt-3 text-sm text-muted">{note}</p>
      ) : snapshot ? (
        <p className="mt-3 text-sm text-faint">Snapshot only. Not a signal.</p>
      ) : null}
      {mint && !wallet ? (
        <p className="mt-2 text-sm text-faint">
          Add a wallet and load again for a direct Arkham, Cielo, or Birdeye PnL link.
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "up" | "down";
}) {
  const color = tone === "down" ? "text-warn" : tone === "up" ? "text-lamp" : "text-fg";
  return (
    <div className="min-w-0">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className={`truncate font-medium tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function PhaseBlock({
  phase,
  ctx,
  checked,
  onToggle,
}: {
  phase: Phase;
  ctx: ToolContext;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  const phaseTotal = phase.tools.reduce((sum, tool) => sum + tool.checks.length, 0);
  const phaseDone = phase.tools.reduce(
    (sum, tool) => sum + tool.checks.filter((item) => checked.has(item.id)).length,
    0,
  );

  return (
    <section id={`phase-${phase.id}`} className="scroll-mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl leading-tight text-fg">
          <span className="mr-2 italic text-lamp">{phase.index}</span>
          {phase.title}
        </h2>
        <p className="shrink-0 text-sm tabular-nums text-faint">
          {phaseDone}/{phaseTotal}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">{phase.stance}</p>
      <div className="mt-3 flex flex-col gap-3">
        {phase.tools.map((tool) => (
          <ToolBlock
            key={tool.id}
            tool={tool}
            ctx={ctx}
            checked={checked}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function ToolBlock({
  tool,
  ctx,
  checked,
  onToggle,
}: {
  tool: ToolCard;
  ctx: ToolContext;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  const Icon = ICONS[tool.id] ?? ShieldAlert;
  const primary = tool.primary?.(ctx) ?? null;
  const secondary = tool.secondary?.(ctx) ?? null;

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-raised text-lamp">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight text-fg">{tool.name}</h3>
          <p className="text-sm text-faint">{tool.handle}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{tool.look}</p>
      {tool.tip ? (
        <p className="mt-3 rounded-xl bg-raised px-3 py-3 text-sm leading-relaxed text-fg">
          <span className="font-medium text-warn">Watch. </span>
          {tool.tip}
        </p>
      ) : null}
      {primary ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <OpenLink target={primary} emphasized />
          {secondary ? <OpenLink target={secondary} /> : null}
          <span className="font-mono text-xs text-faint">
            {hostOf(primary.href)}
            {primary.specific ? " · direct" : " · general"}
            {secondary ? ` · ${hostOf(secondary.href)}` : ""}
          </span>
        </div>
      ) : null}
      <div className="mt-3 flex flex-col">
        {tool.checks.map((item) => {
          const on = checked.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(item.id)}
              className={`flex min-h-11 items-start gap-3 rounded-xl px-1 py-2 text-left ${focusRing}`}
            >
              <span
                aria-hidden="true"
                className={
                  on
                    ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-lamp text-ink"
                    : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-bg"
                }
              >
                {on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
              </span>
              <span
                className={
                  on
                    ? "text-sm leading-relaxed text-muted line-through decoration-line"
                    : "text-sm leading-relaxed text-fg"
                }
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function OpenLink({ target, emphasized = false }: { target: LinkTarget; emphasized?: boolean }) {
  const host = hostOf(target.href);
  return (
    <a
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${target.label} (${host})`}
      className={
        emphasized
          ? `inline-flex min-h-11 items-center gap-2 rounded-full border border-lamp bg-raised px-4 text-sm font-medium text-fg ${focusRing}`
          : `inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-raised px-4 text-sm font-medium text-fg ${focusRing}`
      }
    >
      {target.label}
      <ExternalLink className="size-4 text-lamp" aria-hidden="true" />
    </a>
  );
}
