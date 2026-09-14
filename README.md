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

This repository is the Phase 1 archive: a homepage feed that normalizes those streams into one specimen list.

---

🖥 The Archive (this app)

The home route is a chronological (or mixed) feed of **Evidence of Slop** / **Counter-Slop**, aggregated from pluggable source adapters:

| Adapter | What it pulls | Demo path |
| --- | --- | --- |
| `archive` | Curated seed JSON in `src/data/archive.json` | Always on; no keys |
| `reddit` | Public JSON for a configurable subreddit (or search) | Proxied in Vite; **degrades** if Reddit returns 403 |
| `rss` | RSS/Atom for a configurable feed URL | Proxied in Vite; default is [404 Media](https://www.404media.co/) |
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

Reddit’s public JSON is often **blocked from datacenter IPs** (HTTP 403). The adapter stays wired; the UI marks the source `blocked` and the archive + RSS streams still render. Try the same `npm run dev` on a residential network to see live `r/midjourney` (or whatever you configure).

**X and Instagram do not work on the zero-key demo path.** Official APIs require credentials (paid/restricted). This repo does **not** scrape x.com or instagram.com HTML. With no token and no bridge URL, the adapters register, the filter chips appear, and the LED reads `unconfigured`. Seed archive + RSS still load.

To go live:

1. **Official:** put `X_BEARER_TOKEN` and/or `INSTAGRAM_ACCESS_TOKEN` in `.env.local` (never commit it). Restart `npm run dev`. X uses API v2 recent search or a user timeline; Instagram uses Graph `GET /me/media` (the authenticated account, not an arbitrary public profile).
2. **Bridge:** set `VITE_X_RSS_URL` / `VITE_INSTAGRAM_RSS_URL` to a public RSS/Atom URL you control or a documented third-party bridge (a Nitter instance’s `/user/rss`, RSSHub `instagram/user/{username}`, etc.). If the official call is unconfigured or blocked, the adapter falls back to that feed. Instances die; pick one you can replace.

Aliases: `TWITTER_BEARER_TOKEN`, `IG_ACCESS_TOKEN`.

Third-party fetches go through a Vite middleware proxy (`/api/reddit`, `/api/rss`, `/api/x`, `/api/instagram`) so the browser does not hit CORS and tokens never enter `import.meta.env`. The same plugin is attached to `vite preview`. A static host without that middleware will still show the seed archive; remote adapters need the proxy or a later serverless route.

### Adding a source

1. Implement `SourceAdapter` from `src/types/feed.ts` (`id`, `label`, `fetch(cursor?)` → `{ items, nextCursor? }`).
2. Map the upstream payload onto `FeedItem` (reuse `src/lib/tags.ts` / `src/lib/time.ts` if useful).
3. Register the adapter in `src/sources/registry.ts`.
4. If the origin has CORS or needs a User-Agent, add a route in `server/feedProxy.ts` (keep SSRF checks: https only, no loopback/private IPs, size + time limits).
5. Optional: a `VITE_*` flag in `src/config.ts` and `.env.example`.

Seed-only additions: append objects to `src/data/archive.json`. No proxy required.

Next hooks that fit this shape without new product chrome: Mastodon/Bluesky public JSON, an uploads folder, or a small `/api` worker for production deploys.

---

🚀 Roadmap

- [x] Phase 1: The Archive. Public feed + source adapters (seed, Reddit, RSS, X, Instagram). Community submission hub still open.
- [ ] Phase 2: The Slop Index. Build a searchable database of aesthetic archetypes (e.g., The Hyper-Plastic, The Nuance Loop).
- [ ] Phase 3: Drift Analysis. Develop tools to quantify the movement of the statistical centroid in real-time.

---

🤝 Join the Gang

We are looking for Forensic Aestheticists, Data Scientists, Digital Artists, and Cultural Anthropologists.

If you see the pattern in the noise, you belong here.

[Link to Reddit/Discord/Website]

---

“The most profound truths are not found in the outliers, but in the center of the sludge.”
