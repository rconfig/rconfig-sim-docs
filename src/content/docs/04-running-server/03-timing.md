---
title: "Response timing & jitter"
description: "Tune per-command response latency in rConfig-sim with --response-delay-ms-min and --response-delay-ms-max to simulate realistic network device response times."
sidebar:
  label: Response timing
  order: 3
slug: running-server/timing
---

Real devices don't answer instantly. rConfig-sim adds a configurable per-command delay so your
tooling sees realistic latency — and so timeouts and concurrency behaviour get exercised.

## The delay flags

| Flag | Default | Purpose |
|---|---|---|
| `--response-delay-ms-min` | `50` | Minimum per-command delay (ms) |
| `--response-delay-ms-max` | `500` | Maximum per-command delay (ms) |

Before each command's response, the server sleeps a uniform random duration between the min
and max. Set both to `0` for maximum throughput (useful when benchmarking your own tool's
ceiling rather than realistic device behaviour):

```bash
--response-delay-ms-min 0 --response-delay-ms-max 0
```

Or widen the band to simulate a slow, jittery fleet:

```bash
--response-delay-ms-min 200 --response-delay-ms-max 2000
```

## How it interacts with faults

The same delay path is where the `slow_response` fault applies. When that fault fires for a
command, the base delay is multiplied by a random factor of **10–50×**, capped at 60
seconds. To keep the multiplier observable even when the configured delay is `0`, a 10 ms
floor is applied before multiplying. See [Fault injection](/faults/overview/).

## Per-device latency

The delay flags apply to the whole fleet. To make specific devices slow, give them a
`latency:<min>-<max>` [device profile](/faults/device-profiles/), which replaces the global
min/max for those devices only:

```bash
--device-profiles "latency:1s-3s@10%"
```

## Session cap

Every session is closed after `--max-session` (default `5m`), however long the client keeps
it open. A device with a `hang` profile has the cap extended by its hang. Slow devices do
not, so when a whole session on a slow device can run past 5 minutes (for example a large
config at high latency), raise the cap, or the simulator ends the session rather than the
client under test:

```bash
--max-session 15m
```

## Observing latency

Per-command latency (including any delay and fault multiplier) is recorded in the
`rcfgsim_command_duration_seconds` histogram, labeled by the canonical command name. Session
lifetime and handshake time have their own histograms. See
[Metrics reference](/metrics/reference/) and the
[Grafana query recipes](/metrics/grafana/).
