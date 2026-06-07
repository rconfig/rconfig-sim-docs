---
title: "Prometheus metrics reference"
description: "Complete reference for every Prometheus metric rcfg-sim exposes: names, types, labels, and histogram buckets — all treated as a stable public API."
sidebar:
  label: Metrics reference
  order: 2
slug: metrics/reference
---

Every metric rcfg-sim exposes, with its labels and buckets. Metric names and label keys are
**public API** — see [versioning & scope](/contributing/scope/).

## Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `rcfgsim_active_sessions` | Gauge | — | SSH sessions currently open across all listeners |
| `rcfgsim_sessions_total` | Counter | `result` | Sessions closed, by terminal result |
| `rcfgsim_session_duration_seconds` | Histogram | — | End-to-end session lifetime (accept → close) |
| `rcfgsim_command_duration_seconds` | Histogram | `command` | Per-command dispatch + response latency |
| `rcfgsim_bytes_sent_total` | Counter | — | Total bytes written to SSH channels |
| `rcfgsim_auth_attempts_total` | Counter | `result` | SSH password-auth attempts, by result |
| `rcfgsim_handshake_duration_seconds` | Histogram | — | TCP accept → completed SSH handshake |
| `rcfgsim_faults_injected_total` | Counter | `type` | Faults injected, by type |

## Label values

These are the closed sets pre-registered at startup:

- **`rcfgsim_sessions_total{result}`** — `ok`, `auth_fail`, `disconnect`, `error`
- **`rcfgsim_auth_attempts_total{result}`** — `ok`, `fail`
- **`rcfgsim_faults_injected_total{type}`** — `auth_fail`, `disconnect_mid`, `slow_response`, `malformed`
- **`rcfgsim_command_duration_seconds{command}`** — the Cisco command set, pre-registered at zero:
  `CmdUnknown`, `CmdEmpty`, `CmdAmbiguous`, `CmdTerminalLength`, `CmdTerminalPager`,
  `CmdEnable`, `CmdShowVersion`, `CmdShowRunningConfig`, `CmdShowStartupConfig`,
  `CmdShowInventory`, `CmdExit`.

:::note[TL1 command labels]
The [Ciena TL1 driver](/drivers/ciena-tl1/) emits additional `command` values —
`CmdTL1ActUser`, `CmdTL1RtrvEqpt`, `CmdTL1RtrvAlmAll`, `CmdTL1RtrvCondAll`,
`CmdTL1RtrvActiveUser`, `CmdTL1RtrvSwVer`, `CmdTL1RtrvSys`, `CmdTL1Deny`, `CmdTL1Unknown`.
These appear once a Ciena device is served; they are not part of the pre-registered Cisco set.
:::

## Histogram buckets

| Histogram | Buckets (seconds) |
|---|---|
| `rcfgsim_session_duration_seconds` | 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60 |
| `rcfgsim_command_duration_seconds` | 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5 |
| `rcfgsim_handshake_duration_seconds` | 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5 |

## Runtime & process metrics

Standard Go (`go_*`) and process (`process_*`) collectors are also registered — goroutine
counts, heap and GC stats, CPU time, and open file descriptors.

See [Grafana queries](/metrics/grafana/) for ready-to-use expressions over these metrics.
