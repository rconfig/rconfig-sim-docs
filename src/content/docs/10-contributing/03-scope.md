---
title: "Scope & versioning"
description: "What is in and out of scope for rcfg-sim, the public-API surface that constitutes a breaking change, and the project's pre-1.0 SemVer policy."
sidebar:
  label: Scope & versioning
  order: 3
slug: contributing/scope
---

Before proposing a change, check it against the project's scope and the breaking-change
surface. It's always cheaper to flag a breaking change on purpose than to apologise and revert.

## In scope

- SSH server, dispatch, and session handling fixes
- Generator improvements (new buckets, new vendor models)
- Metrics — with **bounded** label cardinality
- New fault types
- Deployment artifacts (systemd, sysctl, limits, IP-alias helpers)
- Documentation and CI

## Out of scope

- Full Cisco IOS emulation (it answers a bounded `show` set; it does not implement IOS)
- A network topology / data-plane simulator (no routing, no forwarding)
- Config mutation (devices serve configs; they don't accept changes)
- Production-only features unrelated to load testing

## The breaking-change surface

Assume external users depend on all of these. Changing any is a **breaking** change:

- **Model names** — the `--distribution` / `size_bucket` keys: `sm`, `md`, `lg`, `xl`, `2xl`,
  `3xl`, `4xl`, `5xl`, `6xl`, `ciena-6500-tl1`
- **Driver / template ids** — the manifest `template` values (`cisco_ios`, `ciena_tl1`)
- **`--distribution` syntax** (`model:weight,...`)
- **All CLI flag names and defaults** on both binaries
- **Manifest CSV header order**
- **Prometheus metric names and label keys** (cardinality is asserted by test)
- **Systemd unit name** `rcfg-sim@<IP>.service` and the env-file variable names
- **Default paths** (`/etc/rcfg-sim/`, `/opt/rcfg-sim/`, the host-key path)
- **The recognised commands per driver** and their abbreviations

## Versioning (pre-1.0)

The project follows [Semantic Versioning](https://semver.org/), with one pre-1.0 wrinkle:

- Every release is currently a **patch** bump (`0.0.1 → 0.0.2 → …`).
- Breaking changes are allowed at any patch bump while pre-1.0 — but must be documented under a
  `### Breaking` heading in the [changelog](/contributing/changelog/) with a migration note.
- `0.1.0` and `1.0.0` are reached only when the maintainer explicitly declares the milestone.

Post-1.0, the table flips to strict SemVer: the breaking-change surface above becomes MAJOR,
additive changes (new buckets, commands, faults, metrics, flags with safe defaults) are MINOR,
and bug/doc/perf-only changes are PATCH.

## When in doubt

If a change touches the breaking-change surface, raise it before committing. See also
[commit conventions](/contributing/commit-conventions/) for how to flag the bump.
