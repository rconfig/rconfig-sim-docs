---
title: "Using rcfg-sim with rConfig"
description: "How to point rConfig at an rcfg-sim simulated fleet to load-test network configuration management workflows — backups, diffs, and compliance — at scale."
sidebar:
  label: Using with rConfig
  order: 4
slug: examples/using-with-rconfig
---

rcfg-sim was originally built to load-test [rConfig](https://www.rconfig.com), the network
configuration management (NCM) platform, and the two pair naturally. This page explains the
relationship and how to wire them together.

## Two different tools

It's worth being precise about what each one is:

- **rConfig** is the product under test — a full **network configuration management**
  platform that backs up device configs, tracks changes, runs diffs, and enforces compliance
  across a real fleet. Its product site is [www.rconfig.com](https://www.rconfig.com), and its
  user documentation lives at [docs.rconfig.com](https://docs.rconfig.com) (with the V8 core
  developer docs at [v8coredocs.rconfig.com](https://v8coredocs.rconfig.com)).
- **rcfg-sim** (this project) is a **test instrument** — a simulator that presents a fleet of
  fake devices so you can drive rConfig (or any SSH-based tool) at scale.

If you're looking for how to *use* rConfig itself — installing it, configuring device
credentials, scheduling backups, building compliance policies — that's all in the
[rConfig documentation](https://docs.rconfig.com), not here. This site is only about the
simulator.

## The setup

```text
  rConfig            ──SSH backups──▶   rcfg-sim
  (NCM under test)                      (simulated fleet)
      │                                     │
      │ app metrics/logs                    │ /metrics
      └──────────────▶ Prometheus / Grafana ◀┘
```

1. **Generate a fleet** that mirrors your target deployment's shape. Match the device count
   and pick a [size distribution](/generating-configs/size-buckets/) close to your real mix.
2. **Expose it on routable IPs** so the rConfig host can reach it — see
   [network setup](/installation/network-setup/) and use routable (not loopback) aliases.
3. **Add the devices to rConfig.** Use the manifest's credentials (default `admin` / `admin`,
   enable `enable123`) and the `ip:port` pairs from the
   [manifest](/generating-configs/manifest/). The rConfig
   [device-management docs](https://docs.rconfig.com) cover bulk import.
4. **Run a backup cycle** across the whole fleet and watch both sides — rConfig's own metrics
   and rcfg-sim's [Prometheus metrics](/metrics/overview/).

## What you can learn

- How rConfig's scheduler behaves when thousands of backups fire in one window
- Throughput and tail latency of a full collection cycle against realistic config sizes
- How the diff and storage layers handle multi-megabyte (`xl`–`6xl`) configs
- Resilience to a misbehaving fleet via [fault injection](/faults/overview/) — auth failures,
  mid-transfer drops, slow devices, malformed output

## Realistic mixed fleets

For a deployment that includes optical gear, mix in the
[`ciena-6500-tl1`](/drivers/ciena-tl1/) model and run the server with
[`--ssh-auth=driver`](/running-server/ssh-auth/) so Cisco and Ciena devices authenticate the
way they really do. This tests rConfig's multi-vendor handling, not just its Cisco path.

## Not an rConfig user?

rcfg-sim speaks plain SSH and emits standard Prometheus metrics — it works with **any**
SSH-based automation, backup, or NCM system. Nothing on this site assumes rConfig beyond this
page.
