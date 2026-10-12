export const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

export const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(value: string): boolean {
  return ADDRESS_RE.test(value.trim());
}

export function shortAddress(value: string): string {
  if (value.length < 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export type LinkTarget = {
  href: string;
  label: string;
  specific: boolean;
};

export type CheckItem = {
  id: string;
  label: string;
};

export type ToolContext = {
  mint: string;
  wallet: string;
  pairUrl: string | null;
};

export type ToolCard = {
  id: string;
  name: string;
  handle: string;
  look: string;
  tip?: string;
  checks: CheckItem[];
  primary?: (ctx: ToolContext) => LinkTarget;
  secondary?: (ctx: ToolContext) => LinkTarget | null;
};

export type Phase = {
  id: string;
  index: string;
  title: string;
  stance: string;
  tools: ToolCard[];
};

function tokenLink(name: string, home: string, direct: (mint: string) => string) {
  return (ctx: ToolContext): LinkTarget =>
    ctx.mint
      ? { href: direct(ctx.mint), label: `Open ${name}`, specific: true }
      : { href: home, label: `Open ${name}`, specific: false };
}

export const phases: Phase[] = [
  {
    id: "before",
    index: "01",
    title: "Before you buy",
    stance: "If this phase fails, you are done.",
    tools: [
      {
        id: "rugcheck",
        name: "Rugcheck",
        handle: "rugcheck.xyz",
        look: "Scroll down to insider networks. Red bubbles are wallets that got supply for free.",
        checks: [
          {
            id: "rugcheck-insiders",
            label: "Insider networks checked — no cluster of free supply",
          },
        ],
        primary: tokenLink(
          "Rugcheck",
          "https://rugcheck.xyz/",
          (mint) => `https://rugcheck.xyz/tokens/${mint}`,
        ),
      },
      {
        id: "bubblemaps",
        name: "Bubblemaps",
        handle: "bubblemaps.io",
        look: "One big connected cluster means skip.",
        checks: [
          {
            id: "bubblemaps-cluster",
            label: "Holder map is not one connected cluster",
          },
        ],
        primary: tokenLink(
          "Bubblemaps",
          "https://v2.bubblemaps.io/",
          (mint) => `https://v2.bubblemaps.io/map?address=${mint}&chain=solana`,
        ),
      },
      {
        id: "gmgn",
        name: "GMGN",
        handle: "gmgn.ai",
        look: "Check the dev’s past launches. Twenty dead coins means a twenty-first is coming.",
        checks: [
          {
            id: "gmgn-dev",
            label: "Dev history is not a graveyard of dead launches",
          },
        ],
        primary: tokenLink(
          "GMGN",
          "https://gmgn.ai/",
          (mint) => `https://gmgn.ai/sol/token/${mint}`,
        ),
      },
    ],
  },
  {
    id: "pumped",
    index: "02",
    title: "It already pumped",
    stance: "Late money is often the exit.",
    tools: [
      {
        id: "dexscreener",
        name: "DexScreener",
        handle: "dexscreener.com",
        look: "Open the top traders tab. Early wallets taking profit means you are their exit.",
        checks: [
          {
            id: "dex-traders",
            label: "Top traders are not unloading into late buyers",
          },
        ],
        primary: (ctx) => {
          if (ctx.pairUrl) {
            return { href: ctx.pairUrl, label: "Open DexScreener", specific: true };
          }
          if (ctx.mint) {
            return {
              href: `https://dexscreener.com/solana/${ctx.mint}`,
              label: "Open DexScreener",
              specific: true,
            };
          }
          return {
            href: "https://dexscreener.com/solana",
            label: "Open DexScreener",
            specific: false,
          };
        },
      },
      {
        id: "kolscan",
        name: "Kolscan",
        handle: "kolscan.io",
        look: "Did the KOL buy before the tweet? Then they are selling into you.",
        checks: [
          {
            id: "kolscan-timing",
            label: "KOL buy time is not loaded before the call",
          },
        ],
        primary: () => ({
          href: "https://kolscan.io/tokens",
          label: "Open Kolscan tape",
          specific: false,
        }),
      },
    ],
  },
  {
    id: "whale",
    index: "03",
    title: "A whale just moved",
    stance: "Name the wallet, then watch the next one.",
    tools: [
      {
        id: "arkham",
        name: "Arkham",
        handle: "arkm.com",
        look: "Who it is, and where the money went.",
        checks: [
          {
            id: "arkham-who",
            label: "Identified the wallet and where the funds went",
          },
        ],
        primary: (ctx) => {
          if (ctx.wallet) {
            return {
              href: `https://arkm.com/explorer/address/${ctx.wallet}`,
              label: "Open Arkham",
              specific: true,
            };
          }
          if (ctx.mint) {
            return {
              href: `https://arkm.com/explorer/token/${ctx.mint}`,
              label: "Open Arkham",
              specific: true,
            };
          }
          return { href: "https://arkm.com/", label: "Open Arkham", specific: false };
        },
      },
      {
        id: "cielo",
        name: "Cielo",
        handle: "cielo.finance",
        look: "Alert that wallet so you see the next move live.",
        checks: [
          {
            id: "cielo-alert",
            label: "Alert is set on the wallet that just moved",
          },
        ],
        primary: (ctx) =>
          ctx.wallet
            ? {
                href: `https://app.cielo.finance/profile/${ctx.wallet}`,
                label: "Open Cielo",
                specific: true,
              }
            : {
                href: "https://app.cielo.finance/",
                label: "Open Cielo",
                specific: false,
              },
      },
    ],
  },
  {
    id: "away",
    index: "04",
    title: "You’re not at the screen",
    stance: "The bot is not a strategy.",
    tools: [
      {
        id: "copyfomo",
        name: "CopyFomo",
        handle: "copyfomo.com",
        look: "Pick a trader from the FOMO leaderboard, set your size. The bot mirrors buys and sells in about a second.",
        tip: "Skip the trader everyone copies. More copiers means worse fills. Your wallet, your keys — revoke access anytime.",
        checks: [
          {
            id: "copyfomo-pick",
            label: "Size is set on a trader who isn’t the most-copied name",
          },
          {
            id: "copyfomo-keys",
            label: "Confirmed: my keys stay mine, and I can revoke access",
          },
        ],
        primary: () => ({
          href: "https://www.copyfomo.com/",
          label: "Open CopyFomo",
          specific: false,
        }),
        secondary: () => ({
          href: "https://t.me/copyfomo_bot",
          label: "Open in Telegram",
          specific: false,
        }),
      },
    ],
  },
  {
    id: "down",
    index: "05",
    title: "You’re down bad",
    stance: "Find the damage. Then stop.",
    tools: [
      {
        id: "birdeye",
        name: "Birdeye",
        handle: "birdeye.so",
        look: "Wallet PnL by coin. Find the two or three that did the damage.",
        checks: [
          {
            id: "birdeye-pnl",
            label: "Found the 2–3 coins that did the damage",
          },
        ],
        primary: tokenLink(
          "Birdeye",
          "https://birdeye.so/",
          (mint) => `https://birdeye.so/token/${mint}?chain=solana`,
        ),
        secondary: (ctx) =>
          ctx.wallet
            ? {
                href: `https://birdeye.so/profile/${ctx.wallet}?chain=solana`,
                label: "Wallet PnL",
                specific: true,
              }
            : null,
      },
      {
        id: "logoff",
        name: "Log off",
        handle: "the only edge left",
        look: "Log off till tomorrow. The chart will still be there. Your size might not.",
        checks: [
          {
            id: "logoff-done",
            label: "Logged off until tomorrow",
          },
        ],
      },
    ],
  },
];

export const allChecks: CheckItem[] = phases.flatMap((phase) =>
  phase.tools.flatMap((tool) => tool.checks),
);

export function hostOf(href: string): string {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}
