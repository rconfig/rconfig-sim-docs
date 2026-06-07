---
title: "Running the rcfg-sim server"
description: "How to run the rcfg-sim SSH server: binding a port range, pointing at a manifest, host keys, credentials, and the metrics endpoint."
sidebar:
  label: Overview
  order: 1
slug: running-server/overview
---

`rcfg-sim` is the SSH server. Each instance binds one IP and a contiguous range of ports,
reads a [manifest](/generating-configs/manifest/), `mmap`s the configs, and serves sessions.

## A foreground run

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 \
  --port-start 12000 \
  --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv \
  --host-key /tmp/rcfg-test/hostkey \
  --metrics-addr 127.0.0.1:9100
```

This binds ports `12000–12099` on `127.0.0.1`. In production you run one instance per IP as a
[systemd service](/installation/system-install/) instead of in the foreground.

## Core flags

| Flag | Default | Purpose |
|---|---|---|
| `--listen-ip` | `10.50.0.1` | IP address to bind |
| `--port-start` | `10000` | First port in the contiguous range |
| `--port-count` | `2500` | Number of ports to bind |
| `--manifest` | `/opt/rcfg-sim/manifest.csv` | Authoritative port→config mapping |
| `--host-key` | `/etc/rcfg-sim/ssh_host_rsa_key` | SSH host key (generated if missing) |
| `--metrics-addr` | `0.0.0.0:9100` | Prometheus `/metrics` + `/healthz` address (empty disables) |
| `--max-concurrent-sessions` | `5000` | Cap on concurrent sessions ([drain](/running-server/graceful-shutdown/)) |
| `--log-level` | `info` | `error` \| `warn` \| `info` \| `debug` |

See the full set, including auth, timing, and fault flags, in the
[CLI reference](/reference/cli/#rcfg-sim).

## Credentials

| Flag | Default | Notes |
|---|---|---|
| `--username` | `admin` | Currently informational — SSH auth is password-only |
| `--password` | `admin` | Empty string accepts **any** password |
| `--enable-password` | `enable123` | Cisco enable-mode password |

These are the *accepted* credentials at the transport layer. Per-device credentials in the
manifest are what tools should use. How the SSH layer authenticates is controlled by
[`--ssh-auth`](/running-server/ssh-auth/).

## Host keys

If `--host-key` points at a missing file, the server generates one on first start. Keep the
same key across restarts so SSH clients don't see host-key-changed warnings.

## The metrics endpoint

`--metrics-addr` serves two paths:

- `GET /metrics` — Prometheus exposition format
- `GET /healthz` — liveness check

Set `--metrics-addr ""` to disable the HTTP server entirely. See
[Metrics](/metrics/overview/).

## Next

- [SSH authentication modes](/running-server/ssh-auth/)
- [Response timing & jitter](/running-server/timing/)
- [Concurrency & graceful drain](/running-server/graceful-shutdown/)
