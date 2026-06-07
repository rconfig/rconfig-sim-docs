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
[`cisco_ios`](/drivers/cisco-ios/) and [`ciena_tl1`](/drivers/ciena-tl1/) — and adding more
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
registry (`driverFor`). Unknown or empty values fall back to `cisco_ios`, so older manifests
keep working unchanged.

```text
new SSH session
   │
   ▼
manifest row ── template column ──▶ driver registry
                                        │
                    ┌───────────────────┼───────────────────┐
                 cisco_ios            ciena_tl1        unknown / empty
                    │                    │                    │
                    ▼                    ▼                    ▼
              ciscoIOS.Serve       cienaTL1.Serve      ciscoIOS.Serve  (fallback)
```

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
- [Ciena 6500 TL1 (`ciena_tl1`)](/drivers/ciena-tl1/) — `ACT-USER` login, `RTRV-*` verbs

Want to add your own? See [Writing a new driver](/drivers/writing-a-driver/).
