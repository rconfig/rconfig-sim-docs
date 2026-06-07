---
title: "The manifest CSV format"
description: "The rcfg-sim manifest CSV schema — the authoritative mapping of IP and port to config file, credentials, vendor, and driver that the SSH server reads."
sidebar:
  label: Manifest format
  order: 3
slug: generating-configs/manifest
---

The **manifest** is the contract between the generator and the server. It is a CSV that maps
every `ip:port` to its config file, credentials, vendor, and driver. `rcfg-sim` reads it at
startup to know what to bind and how each device should behave.

## Schema

The header (and column order) is:

```csv
hostname,ip,port,vendor,template,username,password,enable_password,config_file,size_bucket
```

| Column | Meaning |
|---|---|
| `hostname` | The device's hostname (shown in prompts and `show version`) |
| `ip` | IP the listener binds |
| `port` | Port the listener binds |
| `vendor` | Manifest vendor string (e.g. `Cisco`, `Ciena`) |
| `template` | **Driver id** — resolves the runtime [driver](/drivers/overview/) (`cisco_ios`, `ciena_tl1`) |
| `username` | Accepted username for this device |
| `password` | Accepted password |
| `enable_password` | Enable-mode password |
| `config_file` | Absolute path to the `.cfg` this device serves |
| `size_bucket` | The [model/bucket](/generating-configs/size-buckets/) the device was generated from |

:::caution[Public API]
The manifest header and column order are part of rcfg-sim's stable surface. The `template`
column is how the server selects a driver per device — see
[`driverFor`](/drivers/overview/#how-a-driver-is-selected).
:::

## Example rows

```csv
hostname,ip,port,vendor,template,username,password,enable_password,config_file,size_bucket
rtr-msp-hq-1000,10.50.0.1,10000,Cisco,cisco_ios,admin,admin,enable123,/opt/rcfg-sim/configs/device-00000.cfg,md
ciena-lax-1001,10.50.0.1,10001,Ciena,ciena_tl1,admin,admin,enable123,/opt/rcfg-sim/configs/device-00001.cfg,ciena-6500-tl1
```

## Hand-rolling a manifest

You can write a manifest by hand to build a precise, small fleet — useful for tests. As long
as the header matches and each `config_file` exists (or, for `ciena_tl1`, even if the payload
is absent — the driver synthesizes a small canned inventory), the server will serve it.

Unknown or empty `template` values fall back to the `cisco_ios` driver, so older manifests
keep working unchanged.

## Next

- [Determinism & seeds](/generating-configs/determinism/)
- [Running the server](/running-server/overview/)
