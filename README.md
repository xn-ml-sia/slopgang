🧬 Slop Gang
*Mapping the Aesthetic of the Average*

Slop Gang is a forensic exploration into the "aesthetic of the average" within generative AI. While the mainstream focuses on the emergent intelligence and infinite expansion of large models, we focus on the statistical centroid: the high-density mass of the bell curve where bias, homogenization, and model collapse converge.

---

📜 The Manifesto

We believe that "slop"—the predictable, high-probability, hyper-smoothed output of large-scale models—is not just noise; it is a mirror of collective bias.

By studying the textures of the machine's mean, we can detect the "gravity" of our current digital culture. We track the tension between:
1. The Slop: The algorithmic drive toward sterile, hyper-saturated, and perfectly balanced mediocrity.
2. The Mask: The human reaction—the application of "analog" filters (VHS, film grain, chromatic aberration) used to inject artificial grit and mask the uncanny perfection of the machine.

Slop Gang does not seek the outlier; we study the center to understand the drift.

---

🔍 Core Research Pillars

1. The Physics of Slop
We analyze the specific "textures" that define the current state of generative output:
* Visual Slop: The "Hyper-Plastic" aesthetic, volumetric bloom, mathematical symmetry, and the rejection of organic shadow.
* Textual Slop: The "Nuance Loop" (the refusal to take stances), linguistic "AI-isms" (delve, tapestry, landscape*), and rhythmic syntactic monotony.

2. Collapse Engineering
We monitor the feedback loops of Model Collapse. As AI models are increasingly trained on machine-generated data, the "bell curve" narrows. We document the process of "Artificial Grit"—when the machine begins to simulate the look of human imperfection (filters/noise) without understanding the reason for it.

3. Trend Detection (The Slop Drift)
Slop is our most sensitive sensor. By tracking the "Movement of the Mean," we can detect shifts in human and machine preference before they become mainstream. When the "center of gravity" shifts from hyper-smooth to lo-fi, we know the cultural tide has turned.

---

🛠 Methodology

Slop Gang utilizes a multi-platform approach to data collection and curation:

* [Reddit/Community]: A decentralized hub for contributors to submit "Evidence of Slop" and "Counter-Slop" (the human response).
* [Web/Curation]: A digital gallery documenting the "Weekly Average"—the most representative samples of current model biases.
* [Automated Detection]: (In Development) Algorithms designed to detect "Slop Drift" by measuring the entropy and saturation levels of model outputs over time.

This repository still contains the Phase 1 source adapters. The public site no longer renders that feed.

---

🖥 The site (this app)

`/` is the tasting-menu hero only: brand `slopgang`, split ivory/ink centroid fold, and a link to the manifesto. `/about` is the manifesto. Source adapters, proxies, and `archive.json` remain in the repo but are unused by the homepage.

Pluggable adapters (not shown in the UI):

| Adapter | What it pulls | Demo path |
| --- | --- | --- |
| `archive` | Curated seed JSON in `src/data/archive.json` | Always on; no keys |
| `reddit` | Public JSON for a configurable subreddit (or search) | Proxied in Vite and on Netlify; **degrades** if Reddit returns 403 |
| `rss` | RSS/Atom for a configurable feed URL | Proxied in Vite and on Netlify; default is [404 Media](https://www.404media.co/) |
| `x` | X.com / Twitter (official API v2 or optional RSS bridge) | **Unconfigured** without a bearer token or `VITE_X_RSS_URL` |
| `instagram` | Instagram (Graph `/me/media` or optional RSS bridge) | **Unconfigured** without an access token or `VITE_INSTAGRAM_RSS_URL` |

Each item is normalized to: `id`, `source`, title/caption, media or text body, `url`, `timestamp`, and tags (`visual-slop` / `textual-slop` / `counter-slop`).

### Setup

Node 22+ recommended. No paid APIs or secrets are required for the default demo.

```bash
npm install
npm run dev
```

Then open the printed local URL (Vite binds `0.0.0.0:5173`).

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`, `npm run lint`.

Yarn works the same (`yarn` / `yarn dev`).

### Environment

Copy `.env.example` to `.env.local` only if you want to override defaults.

| Variable | Default | Role |
| --- | --- | --- |
| `VITE_ENABLE_REDDIT` | `true` | Set `false` to skip the Reddit adapter |
| `VITE_REDDIT_SUBREDDIT` | `midjourney` | Subreddit for the listing (`^[A-Za-z0-9_]+$`) |
| `VITE_REDDIT_SORT` | `hot` | `hot` \| `new` \| `top` \| `rising` |
| `VITE_REDDIT_QUERY` | _(empty)_ | If set, uses Reddit search instead of the subreddit listing |
| `VITE_ENABLE_RSS` | `true` | Set `false` to skip RSS |
| `VITE_RSS_FEED_URL` | `https://www.404media.co/rss/` | Any public RSS/Atom URL (`http`/`https`, no private hosts) |
| `VITE_ENABLE_X` | `true` | Set `false` to skip the X adapter |
| `VITE_X_HANDLE` | _(empty)_ | Optional `@user` for user timeline (official) or `{handle}` in a bridge URL |
| `VITE_X_QUERY` | _(empty)_ | Optional recent-search query (official API). If both handle and query are empty, the proxy searches `slop` |
| `VITE_X_RSS_URL` | _(empty)_ | Optional RSS/Atom bridge (Nitter, RSSHub, …). Placeholders: `{handle}`, `{query}` |
| `X_BEARER_TOKEN` | _(empty)_ | **Server-only.** X/Twitter API v2 bearer. Do not prefix `VITE_` |
| `VITE_ENABLE_INSTAGRAM` | `true` | Set `false` to skip Instagram |
| `VITE_INSTAGRAM_USERNAME` | _(empty)_ | Optional username for labels / `{username}` in a bridge URL |
| `VITE_INSTAGRAM_HASHTAG` | _(empty)_ | Optional hashtag for `{hashtag}` in a bridge URL (not used by Graph `/me`) |
| `VITE_INSTAGRAM_RSS_URL` | _(empty)_ | Optional RSS/Atom bridge. Placeholders: `{username}`, `{hashtag}` |
| `INSTAGRAM_ACCESS_TOKEN` | _(empty)_ | **Server-only.** Instagram Graph token. Do not prefix `VITE_` |

Reddit’s public JSON is often **blocked from datacenter IPs** (HTTP 403), including Netlify. The adapter stays wired in the proxy; the public site does not render source status.

**X and Instagram do not work on the zero-key demo path.** Official APIs require credentials (paid/restricted). This repo does **not** scrape x.com or instagram.com HTML. With no token and no bridge URL, the adapters register as `unconfigured`. They are unused by the homepage.

To go live locally:

1. **Official:** put `X_BEARER_TOKEN` and/or `INSTAGRAM_ACCESS_TOKEN` in `.env.local` (never commit it). Restart `npm run dev`. X uses API v2 recent search or a user timeline; Instagram uses Graph `GET /me/media` (the authenticated account, not an arbitrary public profile).
2. **Bridge:** set `VITE_X_RSS_URL` / `VITE_INSTAGRAM_RSS_URL` to a public RSS/Atom URL you control or a documented third-party bridge (a Nitter instance’s `/user/rss`, RSSHub `instagram/user/{username}`, etc.). If the official call is unconfigured or blocked, the adapter falls back to that feed. Instances die; pick one you can replace.

Aliases: `TWITTER_BEARER_TOKEN`, `IG_ACCESS_TOKEN`.

Third-party fetches go through `/api/reddit`, `/api/rss`, `/api/x`, `/api/instagram` so the browser does not hit CORS and tokens never enter `import.meta.env`. In `vite` / `vite preview` those routes are Vite middleware (`server/feedProxy.ts`). In production they are Netlify Functions that reuse `server/feedHandlers.ts` (same SSRF checks and unconfigured/blocked JSON).

### Production (Netlify)

[`netlify.toml`](netlify.toml) is the source of truth once the GitHub repo is linked. You do **not** need to re-enter the build command or publish directory in the Netlify UI.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (Netlify installs from `package-lock.json` first) |
| Publish directory | `dist` |
| Node | `22` |
| Functions | `netlify/functions` |
| SPA fallback | `/*` → `/index.html` (`200`) |
| API | `/api/*` → `/.netlify/functions/:splat` (`200`, forced) |

`npm run build` emits hashed `/assets/*.js` (not `/src/main.tsx`). Serving the git tree as static files is what made production look unbundled; this config stops that.

**Environment variables** (Site configuration → Environment variables). Scopes: `VITE_*` need **Builds**; tokens need **Functions** / runtime (or both). Then trigger a redeploy so a new bundle and new function env are published.

| Variable | Required for demo? | Where it applies |
| --- | --- | --- |
| `VITE_ENABLE_*`, `VITE_REDDIT_*`, `VITE_RSS_FEED_URL`, `VITE_X_*`, `VITE_INSTAGRAM_*` | No (defaults match `.env.example`) | Build-time client bundle |
| `X_BEARER_TOKEN` / `TWITTER_BEARER_TOKEN` | No | Function runtime. Without it, X is `unconfigured` unless you also baked in `VITE_X_RSS_URL` |
| `INSTAGRAM_ACCESS_TOKEN` / `IG_ACCESS_TOKEN` | No | Function runtime. Without it, Instagram is `unconfigured` unless you also baked in `VITE_INSTAGRAM_RSS_URL` |

Zero secrets: the public site is the hero + manifesto. Adapter proxies still deploy; they are unused by the homepage.

Remaining dashboard clicks after this file lands: ensure the site is **linked to this repo** (not a drag-and-drop publish of the git root), then merge/redeploy.

### Adding a source

1. Implement `SourceAdapter` from `src/types/feed.ts` (`id`, `label`, `fetch(cursor?)` → `{ items, nextCursor? }`).
2. Map the upstream payload onto `FeedItem` (reuse `src/lib/tags.ts` / `src/lib/time.ts` if useful).
3. Register the adapter in `src/sources/registry.ts`.
4. If the origin has CORS or needs a User-Agent, add a handler in `server/feedHandlers.ts` and a thin file in `netlify/functions/` (keep SSRF checks: https only, no loopback/private IPs, size + time limits). The Vite plugin picks up `/api/<name>` automatically.
5. Optional: a `VITE_*` flag in `src/config.ts` and `.env.example`.

Seed-only additions: append objects to `src/data/archive.json`. No proxy required.

Seed JSON and stills in `src/data/archive.json` / `public/archive/` remain in the tree for later use. The homepage does not load them.

---

🚀 Roadmap

- [x] Phase 1: Public site (hero + manifesto) with unused source adapters still in-repo (seed, Reddit, RSS, X, Instagram).
- [ ] Phase 2: The Slop Index. Build a searchable database of aesthetic archetypes (e.g., The Hyper-Plastic, The Nuance Loop).
- [ ] Phase 3: Drift Analysis. Develop tools to quantify the movement of the statistical centroid in real-time.

---

🤝 Join the Gang

We are looking for Forensic Aestheticists, Data Scientists, Digital Artists, and Cultural Anthropologists.

If you see the pattern in the noise, you belong here.

[Link to Reddit/Discord/Website]

---

“The most profound truths are not found in the outliers, but in the center of the sludge.”
