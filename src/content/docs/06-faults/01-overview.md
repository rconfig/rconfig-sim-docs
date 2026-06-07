---
title: "Fault injection overview"
description: "How rcfg-sim injects realistic faults — auth failures, mid-stream disconnects, slow responses, and malformed output — to test how network tooling handles a misbehaving fleet."
sidebar:
  label: Overview
  order: 1
slug: faults/overview
---

A fleet of 50,000 devices is never perfectly healthy. Some refuse logins, some drop
mid-transfer, some crawl, some return garbage. rcfg-sim can inject these faults on purpose so
you can test how your tooling copes.

## Enabling faults

Two flags control fault injection:

| Flag | Default | Purpose |
|---|---|---|
| `--fault-types` | `""` (none) | Comma-separated list of faults to enable |
| `--fault-rate` | `0.0` | Probability `[0,1]` that an enabled fault fires per event |

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv \
  --host-key /tmp/rcfg-test/hostkey \
  --fault-rate 0.05 \
  --fault-types "auth_fail,slow_response"
```

This enables two fault types, each with a 5% chance of firing on a relevant event. With the
default `--fault-rate 0.0`, no faults fire regardless of `--fault-types` — fault injection is
off by default and has negligible overhead when disabled.

## How firing works

Faults are rolled per relevant event (an auth attempt, a command, a config stream) using a
per-session RNG **seeded from the session ID plus a timestamp**. The result:

- **Deterministic within a session** — a given session behaves consistently.
- **Random across the fleet** — different sessions hit different faults, so aggregate
  behaviour is realistically varied.

## What gets measured

Every fault activation increments
`rcfgsim_faults_injected_total{type="..."}`, so you can confirm faults are firing at the rate
you expect and correlate them with your tool's error handling. See the
[metrics reference](/metrics/reference/).

## Next

- [Fault types](/faults/fault-types/) — exactly what each fault does
- [Examples](/faults/examples/) — recipes for common test scenarios
