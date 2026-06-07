---
title: "Concurrency & graceful drain"
description: "How rcfg-sim caps concurrent sessions and drains in-flight connections on shutdown, for clean restarts of high-density SSH simulator instances."
sidebar:
  label: Concurrency & graceful drain
  order: 4
slug: running-server/graceful-shutdown
---

A simulator that's driven hard needs predictable behaviour at its limits and on shutdown.
rcfg-sim caps concurrency explicitly and drains cleanly.

## Concurrency cap

`--max-concurrent-sessions` (default `5000`) is a hard ceiling on simultaneous SSH sessions
per instance, enforced with a semaphore. It protects the host from unbounded goroutine and
file-descriptor growth if a client opens connections faster than they close.

```bash
--max-concurrent-sessions 10000
```

Raise it for high-fanout tests (and make sure your [FD limits](/installation/system-install/)
are correspondingly high); lower it to model a device that refuses excess connections.

Active sessions are always visible in the `rcfgsim_active_sessions` gauge — watch it to see
how close you are to the cap. See [Metrics reference](/metrics/reference/).

## Graceful shutdown

On `SIGINT`/`SIGTERM` the server shuts down gracefully:

1. It stops accepting new connections (listeners close, freeing the ports).
2. In-flight sessions are allowed to finish.
3. The process exits once draining completes or the timeout elapses.

Under systemd this is wired into the unit with a `SIGTERM` stop and a **45-second** drain
window (`TimeoutStopSec=45s`, `KillMode=mixed`). That's enough for streaming sessions —
including large `show running-config` transfers — to complete before the instance restarts.

```bash
# A clean restart drains active sessions first
sudo systemctl restart rcfg-sim@10.50.0.1.service
```

Because each IP is its own instance, you can drain and restart one slice of the fleet without
disturbing the rest — see [System install](/installation/system-install/).

## Why it matters for testing

Graceful drain means a restart of the simulator isn't seen by your tooling as a fleet-wide
crash. It also means listener ports are released promptly, so a restarted instance can
re-bind without `address already in use` races.
