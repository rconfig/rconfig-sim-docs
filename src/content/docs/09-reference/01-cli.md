---
title: "CLI reference"
description: "Complete command-line reference for both rcfg-sim binaries — every flag, default, and description for the rcfg-sim server and the rcfg-sim-gen generator."
sidebar:
  label: CLI reference
  order: 1
slug: reference/cli
---

Every flag for both binaries, with defaults. Flag names and defaults are **public API** —
see [versioning & scope](/contributing/scope/).

## `rcfg-sim`

The SSH server. One instance per IP.

| Flag | Default | Description |
|---|---|---|
| `--listen-ip` | `10.50.0.1` | IP address to bind |
| `--port-start` | `10000` | First port in the contiguous range |
| `--port-count` | `2500` | Number of ports to bind |
| `--manifest` | `/opt/rcfg-sim/manifest.csv` | Path to the generator manifest (authoritative port→config mapping) |
| `--host-key` | `/etc/rcfg-sim/ssh_host_rsa_key` | Path to the SSH host key (generated if missing) |
| `--username` | `admin` | Accepted SSH username (currently informational; auth is password-only) |
| `--password` | `admin` | Accepted SSH password (empty = accept any) |
| `--enable-password` | `enable123` | Enable-mode password |
| `--ssh-auth` | `password` | SSH transport auth: `password` (all devices) \| `driver` (per-driver) \| `none` (in-band only) |
| `--metrics-addr` | `0.0.0.0:9100` | Prometheus metrics + `/healthz` address (empty = disable) |
| `--response-delay-ms-min` | `50` | Minimum per-command response delay (ms) |
| `--response-delay-ms-max` | `500` | Maximum per-command response delay (ms) |
| `--fault-rate` | `0.0` | Probability `[0,1]` an enabled fault fires per event |
| `--fault-types` | `""` | Comma-separated faults: `auth_fail`, `disconnect_mid`, `slow_response`, `malformed` |
| `--max-concurrent-sessions` | `5000` | Semaphore cap on concurrent sessions |
| `--log-level` | `info` | `error` \| `warn` \| `info` \| `debug` |

## `rcfg-sim-gen`

The config generator. Run once per campaign.

| Flag | Default | Description |
|---|---|---|
| `--count` | `50000` | Number of device configs to generate |
| `--output-dir` | `/opt/rcfg-sim/configs` | Directory for rendered `.cfg` files |
| `--manifest` | `/opt/rcfg-sim/manifest.csv` | Output CSV manifest path |
| `--ip-base` | `10.50.0.1` | First IP alias |
| `--ip-count` | `20` | Number of IP aliases |
| `--port-start` | `10000` | First port in the range |
| `--devices-per-ip` | `2500` | Devices mapped to each IP |
| `--seed` | `42` | PRNG seed for deterministic output |
| `--distribution` | `sm:40,md:40,lg:15,xl:5` | Model weights (percent, sum 100). Models: `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `ciena-6500-tl1` |
| `--username` | `admin` | Username written into the manifest |
| `--password` | `admin` | Password written into the manifest |
| `--enable-password` | `enable123` | Enable password written into the manifest |

## See also

- [Manifest schema](/reference/manifest-schema/)
- [Default paths](/reference/paths/)
- [Size buckets](/generating-configs/size-buckets/) and [fault types](/faults/fault-types/)
