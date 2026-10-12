import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as isSolanaAddress } from "./checklist-data-DGC5tbZV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/token-lookup-CMGKMTqd.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function readPairs(value) {
	if (!value || typeof value !== "object" || !("pairs" in value)) return [];
	const pairs = value.pairs;
	if (!Array.isArray(pairs)) return [];
	return pairs.filter((pair) => !!pair && typeof pair === "object");
}
var lookupToken_createServerFn_handler = createServerRpc({
	id: "530d24b747429623e14e8028c934e7a11e19f65dd8e15cf0cafb48c837dbdd06",
	name: "lookupToken",
	filename: "src/lib/token-lookup.ts"
}, (opts) => lookupToken.__executeServer(opts));
var lookupToken = createServerFn({ method: "GET" }).validator((mint) => {
	const trimmed = mint.trim();
	if (!isSolanaAddress(trimmed)) throw new Error("Invalid Solana mint");
	return trimmed;
}).handler(lookupToken_createServerFn_handler, async ({ data }) => {
	const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${data}`, {
		headers: { accept: "application/json" },
		signal: AbortSignal.timeout(8e3)
	});
	if (!res.ok) return null;
	const pairs = readPairs(await res.json()).filter((pair) => pair.chainId === "solana" && pair.baseToken?.address === data);
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
		pairUrl: typeof top.url === "string" ? top.url : null
	};
});
//#endregion
export { lookupToken_createServerFn_handler };
