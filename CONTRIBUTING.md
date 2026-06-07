# Contributing to the rcfg-sim docs

Thanks for helping improve the [rcfg-sim](https://github.com/rconfig/rconfig-sim)
documentation. This repository is **only** the documentation site
([simdocs.rconfig.com](https://simdocs.rconfig.com)) — for changes to the simulator itself,
open a PR against [rconfig/rconfig-sim](https://github.com/rconfig/rconfig-sim).

## Scope

In scope here:

- Fixing or clarifying documentation pages
- New guides, examples, and reference content for rcfg-sim
- Site infrastructure (Astro/Starlight config, styling, SEO, build/deploy)

Out of scope (belongs in the [tool repo](https://github.com/rconfig/rconfig-sim)):

- Behaviour of the `rcfg-sim` / `rcfg-sim-gen` binaries
- CLI flags, metrics, drivers, fault types — document them here, but change them there

## Local setup

```bash
npm install
npm run dev        # http://localhost:4321  (plain HTTP — do not use https://)
```

## Adding or editing a page

- Pages live under `src/content/docs/NN-section/`. Each file needs frontmatter:

  ```yaml
  ---
  title: "Page title used in <title> and SEO"
  description: "One-sentence meta description (simulator/testing keywords)."
  sidebar:
    label: Short sidebar label
    order: 2
  slug: section/page-slug
  ---
  ```

- Keep `slug` stable once published — it's the public URL. Renaming a file is fine; changing a
  `slug` breaks links and SEO.
- Match the existing voice: concrete, example-led, no marketing fluff.
- **Accuracy is critical.** CLI flags, defaults, metric names/labels, size buckets, and driver
  commands are the simulator's public API. Verify them against the
  [tool source](https://github.com/rconfig/rconfig-sim) before documenting.
- Cross-link related pages with root-relative links (e.g. `/drivers/overview/`).

## SEO guardrails

- Don't duplicate content from `www.rconfig.com`, `docs.rconfig.com`, or
  `v8coredocs.rconfig.com` — write simulator-specific copy and link to those sites instead.
- Give every page a unique `title` and `description`.

## Before you open a PR

```bash
npm run build      # must succeed with no errors
```

- Confirm the page renders and the sidebar/links work (`npm run dev`).
- One topic per PR where possible.

## Commit style

This project follows [Conventional Commits](https://www.conventionalcommits.org/), matching
the tool repo:

```
docs: clarify the ciena TL1 login gate
feat: add a metrics troubleshooting page
fix: correct the default --port-count in the CLI reference
chore: bump astro to 5.x
```

Subjects: lowercase, imperative, no trailing period, under 72 characters.

## Reporting problems

- **Bugs / suggestions for the docs:** open an issue using the templates.
- **Security issues:** do **not** open a public issue — see [SECURITY.md](SECURITY.md).

By contributing, you agree your contributions are licensed under the
[MIT License](LICENSE) and that you abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
