---
title: "Generating configs with rcfg-sim-gen"
description: "How the rcfg-sim-gen generator renders realistic network device configs and a manifest CSV that drives the SSH server."
sidebar:
  label: Overview
  order: 1
slug: generating-configs/overview
---

`rcfg-sim-gen` renders every device's config to disk and writes the **manifest** the server
reads. You run it once per test campaign.

## What it produces

- One `.cfg` file per device in `--output-dir` (e.g. `device-00000.cfg`)
- One `manifest.csv` mapping each `ip:port` to its config, credentials, vendor, and driver

Each device gets a unique hostname, enable secret, interface set, ACLs, routing config, and a
deterministic serial number. The mix of config sizes is controlled by the
[`--distribution`](/generating-configs/size-buckets/) flag.

## A typical run

```bash
./bin/rcfg-sim-gen \
  --count 50000 \
  --output-dir /opt/rcfg-sim/configs \
  --manifest /opt/rcfg-sim/manifest.csv \
  --ip-base 10.50.0.1 \
  --ip-count 20 \
  --devices-per-ip 2500 \
  --port-start 10000 \
  --seed 42 \
  --distribution "sm:40,md:40,lg:15,xl:5"
```

This generates 50,000 configs across 20 IPs (2,500 ports each), with the default enterprise
size mix.

## Key flags

| Flag | Default | Purpose |
|---|---|---|
| `--count` | `50000` | Number of device configs to generate |
| `--output-dir` | `/opt/rcfg-sim/configs` | Where `.cfg` files are written |
| `--manifest` | `/opt/rcfg-sim/manifest.csv` | Output manifest path |
| `--ip-base` | `10.50.0.1` | First IP in the range |
| `--ip-count` | `20` | Number of IPs |
| `--devices-per-ip` | `2500` | Devices mapped to each IP |
| `--port-start` | `10000` | First port in the range |
| `--seed` | `42` | PRNG seed (controls [determinism](/generating-configs/determinism/)) |
| `--distribution` | `sm:40,md:40,lg:15,xl:5` | [Size mix](/generating-configs/size-buckets/) |
| `--username` / `--password` / `--enable-password` | `admin` / `admin` / `enable123` | Credentials written to the manifest |

The full list with descriptions is in the [CLI reference](/reference/cli/#rcfg-sim-gen).

## The `make` wrapper

`make generate-configs` wraps `rcfg-sim-gen` with environment-variable overrides, convenient
when the same parameters are reused across a rig. The underlying flags are identical.

## Next

- [Size buckets & distribution](/generating-configs/size-buckets/)
- [Manifest format](/generating-configs/manifest/)
- [Determinism & seeds](/generating-configs/determinism/)
