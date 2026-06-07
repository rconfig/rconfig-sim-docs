---
title: "Manifest schema reference"
description: "The exact column order and meaning of the rcfg-sim manifest CSV that maps simulated devices to their configs, credentials, vendor, and driver."
sidebar:
  label: Manifest schema
  order: 2
slug: reference/manifest-schema
---

The manifest CSV header and column order, verbatim. This is **public API** — the header
order is stable and the `template` column drives [driver selection](/drivers/overview/).

## Header

```csv
hostname,ip,port,vendor,template,username,password,enable_password,config_file,size_bucket
```

| # | Column | Type | Meaning |
|---|---|---|---|
| 1 | `hostname` | string | Device hostname (shown in prompts / `show version`) |
| 2 | `ip` | string | IP the listener binds |
| 3 | `port` | int | Port the listener binds |
| 4 | `vendor` | string | Manifest vendor string (e.g. `Cisco`, `Ciena`) |
| 5 | `template` | string | Driver id — `cisco_ios`, `ciena_tl1` (unknown/empty → `cisco_ios`) |
| 6 | `username` | string | Accepted username for this device |
| 7 | `password` | string | Accepted password |
| 8 | `enable_password` | string | Enable-mode password |
| 9 | `config_file` | string | Absolute path to the `.cfg` this device serves |
| 10 | `size_bucket` | string | The [model/bucket](/generating-configs/size-buckets/) generated |

See [Manifest format](/generating-configs/manifest/) for examples and hand-rolling guidance.
