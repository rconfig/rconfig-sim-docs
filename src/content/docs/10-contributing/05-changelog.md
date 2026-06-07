---
title: "Changelog & releases"
description: "A summary of rcfg-sim releases and where to find the full changelog and release notes for the open-source network SSH simulator."
sidebar:
  label: Changelog
  order: 5
slug: contributing/changelog
---

The authoritative, always-current changelog lives in the repository
([CHANGELOG.md](https://github.com/rconfig/rconfig-sim/blob/main/CHANGELOG.md)) and on the
[GitHub releases page](https://github.com/rconfig/rconfig-sim/releases). It follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This page is a high-level summary —
see [Scope & versioning](/contributing/scope/) for the policy behind the version numbers.

## Release history

### 0.0.3 — 2026-06-06

- **Multi-vendor [driver framework](/drivers/overview/)** — the server selects a per-device
  personality from the manifest `template` column; Cisco IOS behaviour preserved byte-for-byte.
- **[Ciena 6500 TL1 model](/drivers/ciena-tl1/)** (`ciena-6500-tl1`) — TL1 over SSH with an
  in-band `ACT-USER` login gate and `RTRV-*` verbs.
- **[`--ssh-auth` flag](/running-server/ssh-auth/)** — `password` / `driver` / `none`, for
  mixed Cisco + Ciena fleets.
- Minimum Go raised to **1.24**; CI tests 1.24 and 1.25.

### 0.0.2 — 2026-05-19

- **Breaking:** size buckets renamed to clothing-size labels
  (`small`/`medium`/`large`/`huge` → `sm`/`md`/`lg`/`xl`), with template renames and a new
  `--distribution` default.
- Five new stress tiers **`2xl`–`6xl`** (up to ~128 MB configs). See
  [size buckets](/generating-configs/size-buckets/).

### 0.0.1 — 2026-04-21

- Initial public release: 50,000+ concurrent SSH listeners via `mmap` zero-copy delivery,
  Cisco IOS emulation, the deterministic generator, Prometheus metrics, four fault types,
  and systemd-native operation.

## Versioning policy

rcfg-sim is **pre-1.0**: every release is currently a patch bump, and breaking changes are
allowed at any patch bump while documented under a `### Breaking` heading. See
[Scope & versioning](/contributing/scope/) for the full policy and the breaking-change
surface.
