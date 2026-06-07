---
title: "Architecture & core concepts"
description: "How rcfg-sim sustains 50,000 SSH listeners on one host: mmap zero-copy config delivery, pluggable per-device drivers, deterministic generation, and the two-binary model."
sidebar:
  label: Architecture & concepts
  order: 3
slug: getting-started/concepts
---

rcfg-sim is two binaries and a handful of ideas. Understanding them makes the rest of the
docs straightforward.

## The two binaries

```text
  rcfg-sim-gen ──.cfg files + manifest.csv──▶ [ disk ]
                                                 │
                                                 ▼
  SSH client / NCM platform ────SSH────▶  rcfg-sim  ────/metrics────▶ Prometheus
                                        (SSH server)
```

- **`rcfg-sim-gen`** runs once per test campaign. It renders every device config to disk and
  writes a **manifest CSV** — the authoritative map of `ip:port → config file, credentials,
  vendor, driver`.
- **`rcfg-sim`** is the SSH server. You run one instance per bound IP; it reads the manifest,
  `mmap`s the configs, and serves a contiguous range of ports.

This split keeps generation (CPU- and disk-heavy, done once) separate from serving (the hot
path you want lean).

## Zero-copy config delivery

The reason one host can serve tens of thousands of sessions is that configs are never copied
into application memory on the hot path. Each config file is `mmap`'d once; when a client
runs `show running-config`, the server writes the mmap'd byte slice straight to the SSH
channel. A 5 MB config allocates essentially nothing per request. Hot-path command dispatch
benchmarks at roughly **640 ns/op**.

## Per-device drivers

Each device has a **driver** — a vendor personality that owns the full read/parse/respond
loop. The driver is selected at session start from the manifest's `template` column:

- `cisco_ios` — Cisco IOS (`show ...`, enable mode, prefix-matched commands)
- `ciena_tl1` — Ciena 6500 TL1 (`ACT-USER`, `RTRV-*`)

Shared machinery (response-delay jitter, fault injection, metrics, byte-counting) is
factored out so every driver behaves and reports identically. Adding a vendor is one new
file plus a template. See [Drivers & vendors](/drivers/overview/).

## Determinism

Generation is fully deterministic: the same `--seed` produces byte-identical configs across
runs and machines. This means a test campaign is reproducible — you can regenerate the exact
same 50k fleet months later, and regression tests can hash the output tree. See
[Determinism & seeds](/generating-configs/determinism/).

## Observability and fault injection

The server exposes Prometheus metrics with deliberately **bounded label cardinality** (no
raw user input ever becomes a label) and a `/healthz` endpoint. It can also inject faults —
auth failures, mid-stream disconnects, slow responses, malformed output — at a configurable
rate, so you can test how your tooling handles a fleet that misbehaves. See
[Metrics](/metrics/overview/) and [Fault injection](/faults/overview/).

## Systemd-native operation

At scale you run **one `rcfg-sim` instance per IP alias** as a systemd template service
(`rcfg-sim@<IP>.service`). Each instance restarts and drains independently, which is what
lets a single host present 20 IPs × 2,500 ports = 50,000 devices. See
[System install](/installation/system-install/).
