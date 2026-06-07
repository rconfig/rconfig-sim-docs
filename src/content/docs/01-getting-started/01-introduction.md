---
title: "Introduction to rcfg-sim"
description: "What the rcfg-sim network SSH simulator does, who it is for, and how it differs from emulators like GNS3 and EVE-NG."
sidebar:
  label: Introduction
  order: 1
slug: getting-started/introduction
---

**rcfg-sim** is a high-density SSH simulator for network devices. One Linux host stands up
**50,000+ concurrent SSH listeners**, each speaking real SSH and presenting a realistic
device personality (Cisco IOS or Ciena 6500 TL1) that streams a generated running-config on
demand.

It is purpose-built to **load-test network automation and network configuration management
(NCM) tooling** at the scale real fleets actually reach — without buying hardware or running
a datacentre of full-system emulators.

## The problem it solves

Production network fleets routinely span hundreds to tens of thousands of devices. The
failures that matter at that scale rarely reproduce in a small lab:

- Scheduler fairness when thousands of backups fire in the same window
- Burst handling and connection-pool exhaustion
- Diff-engine and storage behaviour against multi-megabyte configs
- Retry storms and timeout cascades under partial failure
- The real CPU / memory / file-descriptor envelope of a collector at scale

You cannot answer these with unit tests or a 50-device lab. The usual alternatives are
expensive: roughly **$2M of physical hardware**, or full-system VM emulation that melts a
datacentre. rcfg-sim gives you production-shaped load from a single commodity host
(a 12 vCPU / 48 GB box comfortably drives the full 50k).

## What it is

- A pair of small, dependency-light Go binaries: a config **generator** and an SSH
  **server**. See [Architecture & concepts](/getting-started/concepts/).
- A **real** SSH server, not a recording or a mock — clients negotiate a genuine SSH
  transport and read live bytes.
- A **deterministic config generator** that produces realistic Cisco IOS configs from
  ~30 KB to ~128 MB, byte-identical for a given seed.
- **Observable and abusable on purpose**: Prometheus metrics, fault injection, and tunable
  response latency.

## What it is *not*

- Not a full Cisco emulator. It answers a bounded set of `show` commands convincingly; it
  does not implement IOS.
- Not a network topology or data-plane simulator. There is no routing, no forwarding, no
  link state. It is not a replacement for [GNS3](https://www.gns3.com/) or EVE-NG.
- Not a config-mutation engine. Devices serve configs; they do not accept config changes.

## Who it is for

Anyone building or operating SSH-based network tooling: NCM platforms, backup/collection
systems, automation frameworks, and the CI rigs that test them. It is maintained by the
[rConfig](https://www.rconfig.com) team and works with any SSH-based system — see
[Using rcfg-sim with rConfig](/examples/using-with-rconfig/).

Ready to try it? Head to the [Quickstart](/getting-started/quickstart/).
