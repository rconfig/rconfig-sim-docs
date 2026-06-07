---
title: "Metrics & observability overview"
description: "How rcfg-sim exposes Prometheus metrics with bounded cardinality, the /metrics and /healthz endpoints, and what to watch under load."
sidebar:
  label: Overview
  order: 1
slug: metrics/overview
---

rcfg-sim is built to be observed under load. Each server instance exposes Prometheus metrics
and a health endpoint over HTTP.

## The endpoints

`--metrics-addr` (default `0.0.0.0:9100`) serves:

- **`GET /metrics`** — Prometheus exposition format
- **`GET /healthz`** — liveness check

Set `--metrics-addr ""` to disable the HTTP server.

```bash
curl -s http://127.0.0.1:9100/metrics | grep -E '^rcfgsim_'
curl -s http://127.0.0.1:9100/healthz
```

## Bounded cardinality by design

Every metric label is a **closed set** — pre-registered at startup, never derived from raw
user input. A client typing a thousand distinct garbage commands does **not** create a
thousand label values: it all rolls up under `CmdUnknown`. This keeps Prometheus healthy even
when the simulator is abused, and it's asserted by a cardinality test in the project (don't
add new labels casually — labels are part of the [public API](/contributing/scope/)).

Because series are pre-registered at zero, the full metric set appears on the very first
scrape — so you can alert on *absence* of traffic, not just presence.

## What to watch under load

- **`rcfgsim_active_sessions`** — how close you are to `--max-concurrent-sessions`.
- **`rcfgsim_sessions_total{result}`** — throughput and error mix (`ok` vs `auth_fail` /
  `disconnect` / `error`).
- **`rcfgsim_command_duration_seconds`** — per-command latency, including
  [delays](/running-server/timing/) and `slow_response` faults.
- **`rcfgsim_bytes_sent_total`** — aggregate throughput.
- **`rcfgsim_faults_injected_total{type}`** — confirm faults fire at the expected rate.

The full list, with labels and histogram buckets, is in the
[metrics reference](/metrics/reference/). Ready-to-paste queries are in
[Grafana queries](/metrics/grafana/).

## Runtime and process metrics

Alongside the simulator metrics, the standard Go runtime collectors (goroutines, memory, GC)
and process collectors (CPU, open file descriptors) are registered — useful for watching the
host's resource envelope as you scale up.
