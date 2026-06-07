---
title: "Feature verification"
description: "How to verify specific rcfg-sim behaviours by hand — generator determinism, command dispatch, enable mode, graceful shutdown, metrics, and fault injection."
sidebar:
  label: Feature verification
  order: 3
slug: examples/feature-tests
---

Beyond the automated suite, the repo ships a set of short, self-contained manual
verification procedures (`FEATURE-TESTS.md`) — each states its expectation and runs in well
under a minute. They're grouped by area; this page summarizes how to drive the common ones.

## Generator

- **Determinism** — generate twice with the same `--seed` into different directories and
  `diff -r` them; expect no differences. See
  [Determinism & seeds](/generating-configs/determinism/).
- **Distribution** — generate with a known `--distribution` and confirm the `size_bucket`
  column counts in the [manifest](/generating-configs/manifest/) match the weights.

## Server & dispatch

- **Greeting & prompt** — connect and confirm the `<hostname> line 0 is now available`
  greeting and the `>` prompt.
- **Prefix matching** — `sh ver` resolves to `show version`; `en` returns
  `% Ambiguous command`; `end` exits. See the [Cisco IOS driver](/drivers/cisco-ios/).
- **Enable mode** — `enable` + correct password moves the prompt to `#`; a wrong password
  prints `% Access denied`.
- **TL1 login gate** — against a Ciena device, a `RTRV-*` before `ACT-USER` returns `DENY`;
  after a valid `ACT-USER` it returns `COMPLD`. See the [Ciena TL1 driver](/drivers/ciena-tl1/).

## Metrics

- **Endpoint** — `curl /metrics` shows the full `rcfgsim_*` series at zero on a fresh start.
- **Counters move** — run a few sessions and confirm `rcfgsim_sessions_total` and
  `rcfgsim_bytes_sent_total` increase.
- **Cardinality** — type garbage commands and confirm they all roll up under `CmdUnknown`
  rather than creating new label values. See [Metrics overview](/metrics/overview/).

## Faults

- **Each type fires** — enable one fault at `--fault-rate 1.0` and confirm the matching
  `rcfgsim_faults_injected_total{type=...}` increments and the behaviour matches the
  [fault-types reference](/faults/fault-types/).
- **Zero-rate guard** — with `--fault-rate 0.0`, no faults fire regardless of
  `--fault-types`.

## Graceful shutdown

Start a long `show running-config` against a large device, then `systemctl restart` (or send
`SIGTERM`); the in-flight session should complete within the drain window before the instance
restarts. See [graceful drain](/running-server/graceful-shutdown/).

## Running the automated suite

```bash
make test          # unit, incl. determinism + cardinality
make integration   # real SSH over loopback
make bench         # hot-path benchmarks
```
