---
title: "System install with systemd"
description: "Install rcfg-sim as systemd template services with kernel tuning and file-descriptor limits, running one instance per IP alias for high-density operation."
sidebar:
  label: System install
  order: 3
slug: installation/system-install
---

For anything beyond a loopback trial you run rcfg-sim as **systemd template services** — one
instance per IP alias — with kernel and file-descriptor tuning applied. `make install`
handles all of it.

## What `make install` does

```bash
sudo make install
```

This (re)builds the binaries and installs:

- Binaries into `/opt/rcfg-sim/`
- The systemd template unit `rcfg-sim@.service` into `/etc/systemd/system/`
- A sysctl drop-in into `/etc/sysctl.d/` (kernel tuning)
- An FD-limits drop-in into `/etc/security/limits.d/`
- Config under `/etc/rcfg-sim/` (host key, per-instance env files)

A dedicated unprivileged service account (`rcfgsim`) runs the processes.

:::caution[These paths are public API]
Default paths (`/opt/rcfg-sim/`, `/etc/rcfg-sim/`, the host-key path) and the unit name
`rcfg-sim@<IP>.service` are part of rcfg-sim's stable surface. See the
[Reference → paths](/reference/paths/).
:::

## One instance per IP

The unit is a **template** (`rcfg-sim@.service`). The instance name is the IP the service
binds, and each instance reads its own environment file:

```bash
# Enable + start an instance bound to 10.50.0.1
sudo systemctl enable --now rcfg-sim@10.50.0.1.service

# Status / logs
systemctl status rcfg-sim@10.50.0.1.service
journalctl -u rcfg-sim@10.50.0.1.service -f
```

Each instance is independent — you can restart or drain one IP's 2,500 ports without
touching the rest of the fleet. Configuration comes from `/etc/rcfg-sim/<IP>.env` (see
[Running the server](/running-server/overview/) for the variables, modeled on
`deploy/systemd/rcfg-sim-instance.env.sample`).

## Kernel tuning and limits

High-density listeners need a wider kernel envelope. The installed sysctl drop-in raises,
among others:

- `fs.file-max` (to ~2,000,000)
- `net.core.somaxconn`
- `net.ipv4.tcp_tw_reuse`
- `net.ipv4.ip_local_port_range` (widened)
- ARP table sizing for many local addresses

The limits drop-in sets `nofile = 200000` for the `rcfgsim` user, and the unit sets
`LimitNOFILE=200000`. The unit also drains gracefully on stop (`SIGTERM`,
`TimeoutStopSec=45s`) so in-flight sessions finish cleanly.

## Graceful shutdown

The service stops with a SIGTERM and a 45-second drain window. The server stops accepting
new connections, lets active sessions complete, and exits — see
[Concurrency & graceful drain](/running-server/graceful-shutdown/).

## Uninstall

```bash
sudo make uninstall
```

Stops and disables the units and removes the installed binaries and config drop-ins.

## Next

- [Network setup](/installation/network-setup/) — create the IP aliases the instances bind
- [Generating configs](/generating-configs/overview/) — produce the manifest the server reads
