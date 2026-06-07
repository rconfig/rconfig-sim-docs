---
title: "Load-test scenarios"
description: "A progressive ladder of rcfg-sim load-test scenarios, from a 100-device smoke test up to a full 50,000-device fleet, for validating network automation at scale."
sidebar:
  label: Load-test scenarios
  order: 2
slug: examples/scenarios
---

A staged approach to scaling up. Each rung validates something before you commit to the next;
the repo's `TEST-SCENARIOS.md` covers the full progression in depth.

## The ladder

```text
100      →   1,000     →   5,000     →   25,000    →   50,000
smoke        single IP     multi-IP      half fleet    full fleet
```

### 1. Smoke test (100 devices, loopback)

Prove the toolchain end to end: generate, serve, connect, scrape. This is the
[Quickstart](/getting-started/quickstart/). Goal: a clean session and moving metrics.

### 2. Single-IP load (1,000 devices)

One IP, 1,000 ports. Point your collector at the range and run a full backup cycle. Watch
`rcfgsim_active_sessions` and the session error mix. Goal: no errors, latency within
expectation.

### 3. Multi-IP (5,000 devices)

Move to [systemd instances](/installation/system-install/) and
[IP aliases](/installation/network-setup/) — e.g. 2 IPs × 2,500 ports. This validates that
your tooling handles many addresses and that per-instance drain works.

### 4. Half fleet (25,000 devices)

10 IPs × 2,500 ports. Now you're exercising scheduler fairness and burst handling: fire all
backups in a tight window and watch for queueing, timeouts, and resource pressure on both
sides. Introduce [faults](/faults/overview/) at a low rate here.

### 5. Full fleet (50,000 devices)

20 IPs × 2,500 ports on the [reference host](/installation/prerequisites/) (12 vCPU /
48 GB). This is the production-shaped test: a realistic [size
distribution](/generating-configs/size-buckets/), faults at a realistic rate, and a full
collection cycle. Goal: characterize throughput, tail latency, and the resource envelope of
the system under test.

## What to measure at each rung

- **Throughput** — `rate(rcfgsim_sessions_total{result="ok"}[1m])`
- **Error mix** — non-`ok` results as a share of total
- **Tail latency** — p95/p99 of `rcfgsim_command_duration_seconds`
- **Concurrency headroom** — `rcfgsim_active_sessions` vs your cap
- **Host envelope** — Go/process collectors (goroutines, FDs, CPU, memory)

See [Grafana queries](/metrics/grafana/) for the exact PromQL.

## Tips for clean runs

- Keep the [same host key](/running-server/overview/#host-keys) across restarts so clients
  don't see host-key-changed warnings.
- Use a fixed [`--seed`](/generating-configs/determinism/) so each run faces the identical
  fleet.
- Restart instances with `systemctl restart` to get a [graceful
  drain](/running-server/graceful-shutdown/) rather than killing them.
