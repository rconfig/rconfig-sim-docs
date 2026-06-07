# Security Policy

This repository hosts the documentation site for
[rcfg-sim](https://github.com/rconfig/rconfig-sim). It is a static Astro/Starlight site with
no backend and no user data.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue.

- Email **security@rconfig.com**, or
- Use GitHub's **[private vulnerability reporting](https://github.com/rconfig/rconfig-sim-docs/security/advisories/new)**
  ("Report a vulnerability" under the Security tab).

We aim to acknowledge reports promptly, agree a remediation plan, and coordinate disclosure.

## Scope

In scope for **this repository** (the docs site):

- The site build/deploy pipeline and dependencies
- Content Security Policy and HTTP/security headers
- Cross-site scripting or injection via site content or components
- Leaked secrets or credentials in the repository

Out of scope here:

- Vulnerabilities in the **rcfg-sim tool itself** — report those against
  [rconfig/rconfig-sim](https://github.com/rconfig/rconfig-sim) per its `SECURITY.md`.
- Issues in third-party platforms (GitHub, Cloudflare, npm).
- Findings that require a compromised maintainer machine or account.

## Good to know

- No secrets are committed to this repo. Deployment uses Cloudflare credentials stored as
  GitHub Actions secrets.
- Analytics are disabled unless a `PUBLIC_GTM_CONTAINER_ID` is configured at build time.
