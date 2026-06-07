# rcfg-sim documentation

[![Build](https://github.com/rconfig/rconfig-sim-docs/actions/workflows/build.yml/badge.svg)](https://github.com/rconfig/rconfig-sim-docs/actions/workflows/build.yml)
[![Deploy](https://github.com/rconfig/rconfig-sim-docs/actions/workflows/deploy.yml/badge.svg)](https://github.com/rconfig/rconfig-sim-docs/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude-D97757?logo=anthropic&logoColor=white)](https://claude.com/claude-code)
[![Docs site](https://img.shields.io/badge/docs-simdocs.rconfig.com-4f46e5)](https://simdocs.rconfig.com)

The source for **[simdocs.rconfig.com](https://simdocs.rconfig.com)** — the documentation
site for [**rcfg-sim**](https://github.com/rconfig/rconfig-sim), the high-density network
device SSH simulator that stands up 50,000+ realistic Cisco IOS and multi-vendor devices on a
single host for load-testing network automation and configuration tooling.

> Looking for the tool itself? → **[github.com/rconfig/rconfig-sim](https://github.com/rconfig/rconfig-sim)**
> Looking to *use* rConfig (the NCM platform)? → **[docs.rconfig.com](https://docs.rconfig.com)**

---

## Tech stack

- **[Astro](https://astro.build)** 5 + **[Starlight](https://starlight.astro.build)** 0.35 — static documentation framework
- **[Tailwind CSS](https://tailwindcss.com)** — styling
- Deployed as static assets on **[Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)**

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
```

| Script | Description |
|---|---|
| `npm run dev` | Local dev server with hot reload (plain HTTP) |
| `npm run build` | Static production build to `./dist` |
| `npm run preview` | Preview the production build locally |

> **Dev over HTTP:** `npm run dev` serves plain HTTP on `:4321`. Use `http://…:4321`, not
> `https://`. The `upgrade-insecure-requests` CSP directive is automatically omitted for the
> dev server (it's only emitted for built output, which is served over HTTPS).

## Project structure

```
src/
  content/docs/        Documentation pages, grouped into numbered sections
  assets/              Logos + CSS imported by Starlight
  components/starlight/ SkipLink + Footer (rConfig family links) overrides
  pages/robots.txt.ts  Dynamic robots.txt (dev hosts are disallowed)
public/                Static assets served as-is (favicon, og.png)
sidebar.json           Sidebar navigation
astro.config.mjs       Site config, SEO/analytics head tags, integrations
wrangler.jsonc         Cloudflare Workers deployment
```

To add a page, drop a Markdown/MDX file into the relevant `src/content/docs/NN-section/`
folder with `title`, `description`, and `sidebar` frontmatter. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Configuration

Environment variables (all optional):

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_SITE_URL` | `https://simdocs.rconfig.com` | Canonical site URL. Dev builds set this to the dev host so they emit `noindex`. |
| `PUBLIC_GTM_CONTAINER_ID` | _(empty)_ | Google Tag Manager container ID. Analytics scripts render only when set. |

## Deployment

Hosted on Cloudflare Workers static assets ([`wrangler.jsonc`](wrangler.jsonc)). Deploys run
automatically via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

| Branch | Builds with | Deploys to |
|---|---|---|
| `main` | `PUBLIC_SITE_URL=https://simdocs.rconfig.com` | production (`simdocs.rconfig.com`) |
| `development` | `PUBLIC_SITE_URL=https://simdocs.dev.rconfig.com` | dev (`simdocs.dev.rconfig.com`, `noindex`) |

CI requires two repository secrets: `CLOUDFLARE_API_TOKEN` (scoped to *Workers Scripts: Edit*)
and `CLOUDFLARE_ACCOUNT_ID`. Optionally set a `PUBLIC_GTM_CONTAINER_ID` repository variable.

Manual deploy:

```bash
# production
npm run build
npx wrangler deploy

# dev (build with the dev URL first so it is noindex)
PUBLIC_SITE_URL=https://simdocs.dev.rconfig.com npm run build
npx wrangler deploy --env dev
```

## SEO

This site targets simulator / load-testing keywords that are intentionally distinct from the
core rConfig properties (`www.rconfig.com`, `docs.rconfig.com`, `v8coredocs.rconfig.com`) to
avoid keyword cannibalization, while linking back to them (site footer and
*Examples → Using with rConfig*). Only the production host is indexable; dev hosts emit
`noindex` and `Disallow: /`.

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). By participating you agree
to the [Code of Conduct](CODE_OF_CONDUCT.md). For security reports, see [SECURITY.md](SECURITY.md).

## License

Source and documentation prose are licensed under the [MIT License](LICENSE). The rConfig and
"Sim by rConfig" names and logos are trademarks of OS Informatics Limited and are **not**
covered by the MIT License — see [NOTICE](NOTICE).

---

<sub>Maintained by the <a href="https://www.rconfig.com">rConfig</a> team. Built with
<a href="https://starlight.astro.build">Astro Starlight</a> and
<a href="https://claude.com/claude-code">Claude Code</a>.</sub>
