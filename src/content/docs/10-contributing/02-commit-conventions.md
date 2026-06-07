---
title: "Commit conventions"
description: "Conventional Commits style used by rcfg-sim: allowed types, subject formatting, and how breaking changes are flagged in commit messages."
sidebar:
  label: Commit conventions
  order: 2
slug: contributing/commit-conventions
---

rcfg-sim uses [Conventional Commits](https://www.conventionalcommits.org/). Consistent commit
messages drive the changelog and make the version bump obvious.

## Format

```text
<type>[(scope)][!]: <subject>
```

- **type** — one of: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`
- **scope** — optional, e.g. `(sshsrv)`
- **!** — append when the change is breaking, and include a `BREAKING CHANGE:` footer
- **subject** — lowercase, imperative mood, no trailing period, under 72 characters

## Examples

```text
feat: add fault injection for slow_response variance
fix(sshsrv): close listener on graceful shutdown to release port
docs: expand the drivers section with a Ciena worked example
```

A breaking change:

```text
feat!: rename size buckets to clothing-size labels

BREAKING CHANGE: small/medium/large/huge renamed to sm/md/lg/xl.
--distribution strings, manifest size_bucket values, and template
filenames all changed. Users must update --distribution invocations.
```

## Why it matters

The commit type and the `!`/`BREAKING CHANGE` marker determine the release bump. Anything that
touches the [breaking-change surface](/contributing/scope/) — CLI flags, model names, metric
names/labels, manifest schema, default paths, unit names — is a breaking change and must be
flagged. When in doubt, read [Scope & versioning](/contributing/scope/) before committing.
