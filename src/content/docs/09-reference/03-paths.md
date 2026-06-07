---
title: "Default paths & systemd units"
description: "Reference for rcfg-sim default filesystem paths, the systemd template unit name, and per-instance environment files — all part of the stable public surface."
sidebar:
  label: Default paths
  order: 3
slug: reference/paths
---

Default filesystem paths and unit names. These are **public API** — see
[versioning & scope](/contributing/scope/).

## Filesystem paths

| Path | Purpose |
|---|---|
| `/opt/rcfg-sim/` | Installed binaries and (by default) configs |
| `/opt/rcfg-sim/configs/` | Default generated `.cfg` output directory |
| `/opt/rcfg-sim/manifest.csv` | Default manifest path (both binaries) |
| `/etc/rcfg-sim/` | Runtime config: host key, per-instance env files |
| `/etc/rcfg-sim/ssh_host_rsa_key` | Default SSH host-key path |
| `/etc/systemd/system/rcfg-sim@.service` | The systemd template unit |
| `/etc/sysctl.d/` | Kernel-tuning drop-in (installed) |
| `/etc/security/limits.d/` | FD-limits drop-in (installed) |

## Systemd unit

| Item | Value |
|---|---|
| Template unit | `rcfg-sim@.service` |
| Instance form | `rcfg-sim@<IP>.service` (e.g. `rcfg-sim@10.50.0.1.service`) |
| Service account | `rcfgsim` (unprivileged) |
| Per-instance env file | `/etc/rcfg-sim/<IP>.env` |
| FD limit | `LimitNOFILE=200000` |
| Stop behaviour | `SIGTERM`, `TimeoutStopSec=45s`, `KillMode=mixed` (graceful drain) |

The per-instance env file supplies the server flags as environment variables (modeled on
`deploy/systemd/rcfg-sim-instance.env.sample`). See
[System install](/installation/system-install/) and
[graceful drain](/running-server/graceful-shutdown/).

## Default credentials

| Setting | Default |
|---|---|
| Username | `admin` |
| Password | `admin` (empty accepts any) |
| Enable password | `enable123` |

These are test defaults, not production secrets — see [Security](/contributing/security/).
