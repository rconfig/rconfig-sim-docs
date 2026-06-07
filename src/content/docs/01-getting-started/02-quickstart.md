---
title: "rcfg-sim Quickstart"
description: "Generate 100 simulated network devices, run the rcfg-sim SSH server on loopback, connect over SSH, and scrape Prometheus metrics in a few minutes."
sidebar:
  label: Quickstart
  order: 2
slug: getting-started/quickstart
---

This walks you from a clean checkout to a running simulator you can SSH into — 100 devices on
loopback, no root required. For a production 50k install see [Installation](/installation/prerequisites/).

## Prerequisites

- **Go 1.24+** (`go version`)
- `git`, `make`
- An SSH client, plus `sshpass` and `curl` for the test steps

## 1. Build the binaries

```bash
git clone https://github.com/rconfig/rconfig-sim.git
cd rconfig-sim
make build
```

This produces two static binaries in `bin/`:

- `rcfg-sim-gen` — the config generator
- `rcfg-sim` — the SSH server

## 2. Generate 100 device configs

```bash
./bin/rcfg-sim-gen \
  --count 100 \
  --output-dir /tmp/rcfg-test/configs \
  --manifest /tmp/rcfg-test/manifest.csv \
  --ip-base 127.0.0.1 \
  --ip-count 1 \
  --port-start 12000 \
  --devices-per-ip 100 \
  --seed 42
```

This renders 100 `.cfg` files and a `manifest.csv` that maps each `ip:port` to its config,
credentials, and driver. See [Generating configs](/generating-configs/overview/).

## 3. Run the server on loopback

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 \
  --port-start 12000 \
  --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv \
  --host-key /tmp/rcfg-test/hostkey \
  --metrics-addr 127.0.0.1:9100
```

The server binds ports `12000–12099`, generates an SSH host key if one is missing, and
starts serving. Leave it running in this terminal.

## 4. SSH into a simulated device

In a second terminal, drive a full Cisco IOS session. The default credentials are
`admin` / `admin`, enable password `enable123`.

```bash
sshpass -p admin ssh -T \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12000 <<'CMDS'
terminal length 0
enable
enable123
show version
show running-config
exit
exit
CMDS
```

You will see the IOS greeting, a `show version` block, and the full running-config streamed
back. (Two `exit`s: the first leaves enable mode, the second closes the session.)

## 5. Scrape the metrics

```bash
curl -s http://127.0.0.1:9100/metrics | grep -E '^rcfgsim_'
```

You should see counters move — `rcfgsim_sessions_total`, `rcfgsim_bytes_sent_total`,
`rcfgsim_command_duration_seconds`, and more. See [Metrics](/metrics/overview/).

## Next steps

- [Architecture & concepts](/getting-started/concepts/) — how it sustains 50k listeners
- [Size buckets & distribution](/generating-configs/size-buckets/) — control config sizes
- [Fault injection](/faults/overview/) — make devices misbehave on purpose
- [Load-test scenarios](/examples/scenarios/) — progressive recipes from 100 to 50k devices
