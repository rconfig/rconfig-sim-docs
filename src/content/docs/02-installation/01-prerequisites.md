---
title: "Prerequisites & system requirements"
description: "Hardware, OS, and network requirements for running the rcfg-sim SSH simulator, from a laptop trial to a full 50,000-device host."
sidebar:
  label: Prerequisites
  order: 1
slug: installation/prerequisites
---

## Software

- **Go 1.24+** — required to build (declared in `go.mod`; CI tests Go 1.24 and 1.25).
- **make**, **git**.
- **systemd** (v250+) and **iproute2** — for a production multi-instance install.
- **Root access** — needed for `make install`, sysctl tuning, FD limits, and IP aliases.

The binaries are static (`CGO_ENABLED=0`) and depend on only three Go libraries:
`golang.org/x/crypto` (SSH), `golang.org/x/sys`, and `prometheus/client_golang`.

## Hardware

Sizing depends on how many devices you serve and how large their configs are.

| Scenario | vCPU | RAM | Disk |
|---|---|---|---|
| Laptop trial (100–1,000 devices, small configs) | 2 | 4 GB | a few GB |
| Mid-scale rig (5k–10k devices) | 4–8 | 16 GB | 50 GB+ |
| **Full 50k reference** | **12** | **48 GB** | **300 GB** (SSD preferred) |

Disk is driven by the [size distribution](/generating-configs/size-buckets/): a fleet skewed
toward `xl`/`2xl`+ buckets needs far more space than the default 40/40/15/5 mix. Use an SSD —
config delivery is `mmap`-backed and benefits from fast random reads under load.

## Network

A full 50k install maps **20 IP addresses** on one interface to **2,500 ports each**. These
can be plain IP aliases on a single NIC (loopback or routable) — you do **not** need 20
physical interfaces. The [network setup](/installation/network-setup/) page covers the
`deploy/ip-aliases.sh` helper.

For a loopback trial you need nothing beyond `127.0.0.1`.

## File descriptors and kernel limits

Tens of thousands of listeners means tens of thousands of open sockets. A production install
raises `fs.file-max`, the per-user `nofile` limit (to 200,000), and several `net.*` sysctls.
These are applied for you by `make install` — see [System install](/installation/system-install/).

## Next

- Just trying it out? → [Build from source](/installation/build/)
- Standing up a real rig? → [System install](/installation/system-install/)
