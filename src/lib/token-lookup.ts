import { createServerFn } from "@tanstack/react-start";
import { isSolanaAddress } from "@/lib/checklist-data";

export type TokenSnapshot = {
  name: string;
  symbol: string;
  priceUsd: number | null;
  liquidityUsd: number | null;
  change24h: number | null;
  pairUrl: string | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  priceChange?: { h24?: number };
};

function readPairs(value: unknown): DexPair[] {
  if (!value || typeof value !== "object" || !("pairs" in value)) return [];
  const pairs = value.pairs;
  if (!Array.isArray(pairs)) return [];
  return pairs.filter((pair): pair is DexPair => !!pair && typeof pair === "object");
}

export const lookupToken = createServerFn({ method: "GET" })
  .validator((mint: string) => {
    const trimmed = mint.trim();
    if (!isSolanaAddress(trimmed)) {
      throw new Error("Invalid Solana mint");
    }
    return trimmed;
  })
  .handler(async ({ data }): Promise<TokenSnapshot | null> => {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${data}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const pairs = readPairs(await res.json()).filter(
      (pair) => pair.chainId === "solana" && pair.baseToken?.address === data,
    );
    if (!pairs.length) return null;
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const top = pairs[0];
    const price = top.priceUsd ? Number(top.priceUsd) : null;
    return {
      name: top.baseToken?.name?.trim() || "Unknown token",
      symbol: top.baseToken?.symbol?.trim() || "???",
      priceUsd: price != null && Number.isFinite(price) ? price : null,
      liquidityUsd: typeof top.liquidity?.usd === "number" ? top.liquidity.usd : null,
      change24h: typeof top.priceChange?.h24 === "number" ? top.priceChange.h24 : null,
      pairUrl: typeof top.url === "string" ? top.url : null,
    };
  });
