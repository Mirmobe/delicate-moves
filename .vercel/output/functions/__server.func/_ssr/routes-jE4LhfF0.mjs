import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Radar, c as History, d as ChartPie, f as ChartCandlestick, i as RotateCcw, l as ExternalLink, m as Bell, o as Moon, p as Bot, r as ShieldAlert, s as Megaphone, t as Waypoints, u as Check } from "../_libs/lucide-react.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as phases, i as isSolanaAddress, n as allChecks, o as shortAddress, r as hostOf, t as BONK_MINT } from "./checklist-data-DGC5tbZV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-jE4LhfF0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var lookupToken = createServerFn({ method: "GET" }).validator((mint) => {
	const trimmed = mint.trim();
	if (!isSolanaAddress(trimmed)) throw new Error("Invalid Solana mint");
	return trimmed;
}).handler(createSsrRpc("530d24b747429623e14e8028c934e7a11e19f65dd8e15cf0cafb48c837dbdd06"));
var STORAGE_KEY = "meme-master-checklist-v1";
var ICONS = {
	rugcheck: ShieldAlert,
	bubblemaps: Waypoints,
	gmgn: History,
	dexscreener: ChartCandlestick,
	kolscan: Megaphone,
	arkham: Radar,
	cielo: Bell,
	copyfomo: Bot,
	birdeye: ChartPie,
	logoff: Moon
};
var EMPTY = {
	mint: "",
	wallet: "",
	loadedMint: "",
	loadedWallet: "",
	checked: []
};
var focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lamp";
function readStore() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return EMPTY;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return EMPTY;
		const rec = parsed;
		const checked = Array.isArray(rec.checked) ? rec.checked.filter((id) => typeof id === "string") : [];
		return {
			mint: typeof rec.mint === "string" ? rec.mint : "",
			wallet: typeof rec.wallet === "string" ? rec.wallet : "",
			loadedMint: typeof rec.loadedMint === "string" ? rec.loadedMint : "",
			loadedWallet: typeof rec.loadedWallet === "string" ? rec.loadedWallet : "",
			checked
		};
	} catch {
		return EMPTY;
	}
}
function pullAddress(value) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (isSolanaAddress(trimmed)) return trimmed;
	const match = trimmed.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
	if (match && isSolanaAddress(match[0])) return match[0];
	return null;
}
function formatUsd(value) {
	if (value == null || !Number.isFinite(value)) return "—";
	const abs = Math.abs(value);
	if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}k`;
	if (abs >= 1) return `$${value.toFixed(2)}`;
	if (abs >= .01) return `$${value.toFixed(4)}`;
	return `$${value.toPrecision(2)}`;
}
function formatPct(value) {
	if (value == null || !Number.isFinite(value)) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
function ChecklistApp() {
	const [store, setStore] = (0, import_react.useState)(EMPTY);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [fieldError, setFieldError] = (0, import_react.useState)(null);
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [snapshotNote, setSnapshotNote] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const requestId = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const saved = readStore();
		setStore(saved);
		setReady(true);
		if (saved.loadedMint) {
			const id = ++requestId.current;
			fetchSnapshot(saved.loadedMint, id);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	}, [store, ready]);
	const checked = new Set(store.checked);
	const done = allChecks.filter((item) => checked.has(item.id)).length;
	const total = allChecks.length;
	const ctx = {
		mint: store.loadedMint,
		wallet: store.loadedWallet,
		pairUrl: snapshot?.pairUrl ?? null
	};
	async function fetchSnapshot(mint, id) {
		try {
			const snap = await lookupToken({ data: mint });
			if (id !== requestId.current) return;
			setSnapshot(snap);
			setSnapshotNote(snap ? null : "No DexScreener pair yet. The tool links still use this mint.");
		} catch {
			if (id !== requestId.current) return;
			setSnapshot(null);
			setSnapshotNote("Market snapshot didn’t load. The tool links still updated.");
		}
	}
	async function load(rawMint, rawWallet) {
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
			loadedWallet: wallet
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
	function toggle(id) {
		setStore((prev) => {
			const has = prev.checked.includes(id);
			return {
				...prev,
				checked: has ? prev.checked.filter((item) => item !== id) : [...prev.checked, id]
			};
		});
	}
	function clearChecks() {
		setStore((prev) => ({
			...prev,
			checked: []
		}));
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-lamp",
						children: "3am desk"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl leading-tight text-fg sm:text-5xl",
						children: "Meme Master Checklist"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "shrink-0 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-3xl tabular-nums leading-none text-fg",
						children: [done, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-faint",
							children: ["/", total]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-xs text-faint",
						children: "checked"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-xl text-base leading-relaxed text-muted",
				children: "The exact tabs from the 0xNevsky post, in order. Paste a mint, load the tools, and tick the boxes as you go."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-lg italic leading-snug text-fg",
				children: "“Bookmark this. You’ll need it at 3am.”"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex gap-1",
				"aria-hidden": "true",
				children: allChecks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: checked.has(item.id) ? "h-1.5 flex-1 rounded-full bg-lamp" : "h-1.5 flex-1 rounded-full bg-line" }, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "sr-only",
				children: [
					done,
					" of ",
					total,
					" checks complete"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-5",
				onSubmit: (event) => {
					event.preventDefault();
					load(store.mint, store.wallet);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row sm:items-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-sm text-muted",
								children: "Solana token mint"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: store.mint,
								onChange: (event) => {
									setStore((prev) => ({
										...prev,
										mint: event.target.value
									}));
									setFieldError(null);
								},
								placeholder: "Paste a contract address",
								spellCheck: false,
								autoCapitalize: "none",
								autoCorrect: "off",
								autoComplete: "off",
								className: `min-h-12 w-full rounded-xl border border-line bg-bg px-3 font-mono text-base text-fg outline-none placeholder:font-sans placeholder:text-faint focus:border-lamp ${focusRing}`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: loading,
							className: `inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-lamp px-5 font-medium text-ink disabled:opacity-60 ${focusRing}`,
							children: loading ? "Loading…" : "Load tools"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mb-1.5 block text-sm text-muted",
							children: ["Wallet ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-faint",
								children: "optional — whale or yours"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: store.wallet,
							onChange: (event) => {
								setStore((prev) => ({
									...prev,
									wallet: event.target.value
								}));
								setFieldError(null);
							},
							placeholder: "For Arkham, Cielo, and Birdeye PnL",
							spellCheck: false,
							autoCapitalize: "none",
							autoCorrect: "off",
							autoComplete: "off",
							className: `min-h-12 w-full rounded-xl border border-line bg-bg px-3 font-mono text-base text-fg outline-none placeholder:font-sans placeholder:text-faint focus:border-lamp ${focusRing}`
						})]
					}),
					fieldError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "mt-3 text-sm text-warn",
						children: fieldError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void load(BONK_MINT, ""),
							className: `min-h-11 text-sm text-muted underline-offset-4 hover:text-fg hover:underline ${focusRing}`,
							children: "Load BONK as a demo mint"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: clearChecks,
							disabled: done === 0,
							className: `inline-flex min-h-11 items-center gap-2 text-sm text-muted disabled:opacity-40 ${focusRing}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Clear checks"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadedStatus, {
						mint: store.loadedMint,
						wallet: store.loadedWallet,
						snapshot,
						note: snapshotNote,
						loading,
						copied,
						onCopy: () => void copyMint()
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "Phases",
				className: "mt-4 flex gap-2 overflow-x-auto pb-1",
				children: phases.map((phase) => {
					const phaseTotal = phase.tools.reduce((sum, tool) => sum + tool.checks.length, 0);
					const phaseDone = phase.tools.reduce((sum, tool) => sum + tool.checks.filter((item) => checked.has(item.id)).length, 0);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `#phase-${phase.id}`,
						className: `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm text-fg ${focusRing}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display italic text-lamp",
								children: phase.index
							}),
							phase.title,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-faint",
								children: [
									phaseDone,
									"/",
									phaseTotal
								]
							})
						]
					}, phase.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex flex-col gap-10",
				children: phases.map((phase) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhaseBlock, {
					phase,
					ctx,
					checked,
					onToggle: toggle
				}, phase.id))
			}),
			done === total ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 font-display text-2xl leading-snug text-fg",
				children: "All eleven are ticked. If you are down, the last step was to log off."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-10 rounded-2xl border border-line bg-surface p-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: "Not a trade"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: "Research checklist only. This is not a trading bot and not financial advice. Memecoins are extremely high-risk — most people lose money. The hostname sits next to every link so you can confirm the real site before you connect a wallet. Never risk more than you can afford to lose completely."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-faint",
						children: [
							"Steps follow",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://x.com/0xNevsky/status/2108229980257964500",
								target: "_blank",
								rel: "noopener noreferrer",
								className: `text-lamp underline-offset-4 hover:underline ${focusRing}`,
								children: "0xNevsky, 8 Oct 2026"
							}),
							". Not affiliated with any of these tools.",
							ready ? " Checks are saved in this browser." : null
						]
					})
				]
			})
		]
	});
}
function LoadedStatus({ mint, wallet, snapshot, note, loading, copied, onCopy }) {
	if (!mint && !wallet) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm text-faint",
		children: "Rugcheck, Bubblemaps, GMGN, DexScreener, and Birdeye stay on their homepages until you load a mint."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-xl border border-line bg-bg p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 font-display text-xl text-fg",
					children: snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [snapshot.symbol, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 font-sans text-sm text-muted",
						children: snapshot.name
					})] }) : mint ? "Mint loaded" : "Wallet loaded"
				}), mint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCopy,
					className: `min-h-11 text-sm text-lamp ${focusRing}`,
					children: copied ? "Copied" : "Copy mint"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 break-all font-mono text-sm text-faint",
				children: [
					mint ? shortAddress(mint) : null,
					mint && wallet ? " · " : null,
					wallet ? `wallet ${shortAddress(wallet)}` : null
				]
			}),
			snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Price",
						value: formatUsd(snapshot.priceUsd)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "24h",
						value: formatPct(snapshot.change24h),
						tone: snapshot.change24h == null ? "plain" : snapshot.change24h < 0 ? "down" : "up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Liquidity",
						value: formatUsd(snapshot.liquidityUsd)
					})
				]
			}) : null,
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Reading the market snapshot…"
			}) : note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: note
			}) : snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-faint",
				children: "Snapshot only. Not a signal."
			}) : null,
			mint && !wallet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-faint",
				children: "Add a wallet and load again for a direct Arkham, Cielo, or Birdeye PnL link."
			}) : null
		]
	});
}
function Stat({ label, value, tone = "plain" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: `truncate font-medium tabular-nums ${tone === "down" ? "text-warn" : tone === "up" ? "text-lamp" : "text-fg"}`,
			children: value
		})]
	});
}
function PhaseBlock({ phase, ctx, checked, onToggle }) {
	const phaseTotal = phase.tools.reduce((sum, tool) => sum + tool.checks.length, 0);
	const phaseDone = phase.tools.reduce((sum, tool) => sum + tool.checks.filter((item) => checked.has(item.id)).length, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: `phase-${phase.id}`,
		className: "scroll-mt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-2xl leading-tight text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mr-2 italic text-lamp",
						children: phase.index
					}), phase.title]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "shrink-0 text-sm tabular-nums text-faint",
					children: [
						phaseDone,
						"/",
						phaseTotal
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: phase.stance
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-3",
				children: phase.tools.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolBlock, {
					tool,
					ctx,
					checked,
					onToggle
				}, tool.id))
			})
		]
	});
}
function ToolBlock({ tool, ctx, checked, onToggle }) {
	const Icon = ICONS[tool.id] ?? ShieldAlert;
	const primary = tool.primary?.(ctx) ?? null;
	const secondary = tool.secondary?.(ctx) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-line bg-surface p-4 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-11 shrink-0 items-center justify-center rounded-xl bg-raised text-lamp",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-xl leading-tight text-fg",
						children: tool.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-faint",
						children: tool.handle
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: tool.look
			}),
			tool.tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 rounded-xl bg-raised px-3 py-3 text-sm leading-relaxed text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-warn",
					children: "Watch. "
				}), tool.tip]
			}) : null,
			primary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenLink, {
						target: primary,
						emphasized: true
					}),
					secondary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenLink, { target: secondary }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-xs text-faint",
						children: [
							hostOf(primary.href),
							primary.specific ? " · direct" : " · general",
							secondary ? ` · ${hostOf(secondary.href)}` : ""
						]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col",
				children: tool.checks.map((item) => {
					const on = checked.has(item.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "checkbox",
						"aria-checked": on,
						onClick: () => onToggle(item.id),
						className: `flex min-h-11 items-start gap-3 rounded-xl px-1 py-2 text-left ${focusRing}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: on ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-lamp text-ink" : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-bg",
							children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "size-3.5",
								strokeWidth: 2.5
							}) : null
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: on ? "text-sm leading-relaxed text-muted line-through decoration-line" : "text-sm leading-relaxed text-fg",
							children: item.label
						})]
					}, item.id);
				})
			})
		]
	});
}
function OpenLink({ target, emphasized = false }) {
	const host = hostOf(target.href);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: target.href,
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": `${target.label} (${host})`,
		className: emphasized ? `inline-flex min-h-11 items-center gap-2 rounded-full border border-lamp bg-raised px-4 text-sm font-medium text-fg ${focusRing}` : `inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-raised px-4 text-sm font-medium text-fg ${focusRing}`,
		children: [target.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
			className: "size-4 text-lamp",
			"aria-hidden": "true"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChecklistApp, {});
}
//#endregion
export { Home as component };
