---
title: "The driver framework"
description: "How rcfg-sim's pluggable multi-vendor driver framework works — the Driver interface, registry, per-device selection, and shared response machinery."
sidebar:
  label: Overview
  order: 1
slug: drivers/overview
---

A **driver** is a vendor personality. It owns the full interactive loop for one device:
reading input, parsing commands, and writing responses. rcfg-sim ships two —
[`cisco_ios`](/drivers/cisco-ios/), [`ciena_tl1`](/drivers/ciena-tl1/),
[`infinera_tl1`](/drivers/infinera-tl1/) and [`cisco_ons_tl1`](/drivers/cisco-ons-tl1/) — and adding more
is deliberately a one-file job.

## The Driver interface

Every driver implements four methods:

```go
type Driver interface {
    Name() string            // manifest `template` id, e.g. "cisco_ios"
    Commands() []string      // metric label values this driver can emit
    RequiresSSHAuth() bool    // does it authenticate at the SSH transport?
    Serve(ctx *sessionCtx)   // the full interactive loop
}
```

- **`Name()`** is the id used in the manifest `template` column and the registry key.
- **`Commands()`** is the closed set of command labels the driver may emit on
  `rcfgsim_command_duration_seconds`. The server unions these across all drivers and
  pre-registers them, so the metric's cardinality is assembled from drivers rather than
  hardcoded — and stays [bounded](/metrics/overview/).
- **`RequiresSSHAuth()`** is consulted only under [`--ssh-auth=driver`](/running-server/ssh-auth/).
- **`Serve()`** runs the session.

## How a driver is selected

At session start the server looks up the device's manifest `template` value in the driver
registry (`driverFor`). An **empty** value falls back to `cisco_ios`, so older manifests keep
working unchanged.

```text
new SSH session
   │
   ▼
manifest row ── template column ──▶ driver registry
                                        │
        ┌──────────┬──────────┬─────────┴────────┬──────────┐
    cisco_ios   ciena_tl1  infinera_tl1   cisco_ons_tl1   empty
        │           │           │                │          │
        ▼           ▼           ▼                ▼          ▼
   ciscoIOS   cienaTL1   infineraTL1     ciscoONSTL1   ciscoIOS
    .Serve     .Serve       .Serve           .Serve     (fallback)
```

:::caution[An unknown driver id is now a startup error]
A **non-empty** `template` value that no driver is registered for stops the server before it
binds:

```text
rcfg-sim: manifest names unknown driver(s) in the template column: infinira_tl1
```

It used to fall back to `cisco_ios`, which meant a typo'd `infinera_tl1` served a fleet that
looked healthy and spoke the wrong protocol. Failing at startup is louder and cheaper.
:::

## Shared machinery

Drivers don't reimplement timing, faults, or metrics. They route every response through two
shared helpers on the session context:

- **`applyResponseDelay()`** — the single place a response sleep happens (base jitter plus the
  `slow_response` fault multiplier). See [timing](/running-server/timing/).
- **`emit()`** — writes the response, applies `disconnect_mid` / `malformed` faults to streamed
  config bytes, preserves the zero-copy path for the un-faulted case, and records the
  command-duration metric.

This is what guarantees that fault and metric behaviour is identical across vendors — a driver
author gets all of it for free.

## Registration

Each driver registers itself from an `init()` in its own file
(`driver_<vendor>.go`), so nothing else in the hot path needs to know it exists:

```go
func init() { registerDriver(ciscoIOS{}) }
```

## The shipped drivers

- [Cisco IOS (`cisco_ios`)](/drivers/cisco-ios/) — `show` commands, enable mode, prefix matching
- [Ciena 6500 TL1 (`ciena_tl1`)](/drivers/ciena-tl1/) — `ACT-USER` login, `RTRV-NE-LIST` neighbours
- [Infinera DTN-X TL1 (`infinera_tl1`)](/drivers/infinera-tl1/) — `>` prompt, **paged** `RTRV-TIDMAP`
- [Cisco ONS 15454 TL1 (`cisco_ons_tl1`)](/drivers/cisco-ons-tl1/) — **positional** `RTRV-MAP-NETWORK` records

The three TL1 drivers share one core (`internal/sshsrv/tl1.go`) and differ where the hardware
does. Those differences are the point, not an inconvenience:

| | Ciena 6500 | Infinera DTN-X | Cisco ONS 15454 |
|---|---|---|---|
| Prompt | `<` | `>` | `<` |
| Neighbour command | `RTRV-NE-LIST` | `RTRV-TIDMAP` | `RTRV-MAP-NETWORK` |
| Record grammar | keyword, quoted | keyword, empty AID | **positional** |
| Response | one block | **paged** | one block |
| Header SID when routing | the addressed TID | its own system name | the addressed TID |

Want to add your own? See [Writing a new driver](/drivers/writing-a-driver/).
