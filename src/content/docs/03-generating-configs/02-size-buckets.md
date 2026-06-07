---
title: "Size buckets & the distribution flag"
description: "The rcfg-sim config size buckets (sm through 6xl plus ciena-6500-tl1) and how the --distribution flag controls the mix of config sizes across a simulated fleet."
sidebar:
  label: Size buckets & distribution
  order: 2
slug: generating-configs/size-buckets
---

Every device is generated from a **model** (a size bucket). The `--distribution` flag sets
how many devices fall into each bucket, so you can shape a fleet from "mostly small access
switches" to "all pathological cores".

## The distribution syntax

`--distribution` takes comma-separated `model:weight` pairs, where weights are percentages
that should sum to 100:

```bash
--distribution "sm:40,md:40,lg:15,xl:5"   # the default
--distribution "xl:50,2xl:30,3xl:20"      # a heavy, large-config fleet
--distribution "ciena-6500-tl1:100"       # an all-Ciena optical fleet
```

The default `sm:40,md:40,lg:15,xl:5` approximates a typical enterprise fleet.

:::note
Model names are **public API** — they appear in `--distribution` and in the manifest's
`size_bucket` column. Renaming or removing one is a breaking change.
:::

## Cisco IOS size buckets

These nine buckets all use the `cisco_ios` driver. Sizes below are approximate; exact bytes
depend on the seed. The `sm`–`xl` buckets have distinct templates; `2xl`–`6xl` share the
`xl` feature set and scale up the counts.

| Bucket | Approx size | Class | Profile highlights |
|---|---|---|---|
| `sm` | ~30 KB | Access switch | 48 interfaces, basic VLANs/ACLs, no routing |
| `md` | ~150 KB | Aggregation / small router | 48 ifaces + 60 sub-ifaces, OSPF, crypto, QoS |
| `lg` | ~700 KB | Core router | 96 ifaces, BGP (10 neighbours), 3 OSPF areas, VRFs |
| `xl` | ~3–5 MB | DC core / firewall | 192 ifaces, 60 ACLs, 20 BGP, 30 VRFs, big ACLs |
| `2xl` | ~8 MB | Hyperscale edge | 256 ifaces, 100 ACLs, 30 BGP, 50 VRFs |
| `3xl` | ~16 MB | Regional spine | 384 ifaces, 160 ACLs, 40 BGP, 70 VRFs |
| `4xl` | ~32 MB | Service-provider core | 512 ifaces, 240 ACLs, 60 BGP, 100 VRFs |
| `5xl` | ~64 MB | Pathological | 768 ifaces, 380 ACLs, 100 BGP, 150 VRFs |
| `6xl` | ~128 MB | Maximum stress | 1024 ifaces, 600 ACLs, 160 BGP, 220 VRFs |

The larger tiers exist to stress diff engines, parsers, and storage with configs far beyond
what most tools are tested against.

## Ciena bucket

| Bucket | Approx size | Class | Driver |
|---|---|---|---|
| `ciena-6500-tl1` | ~1 KB | Ciena 6500 7-slot optical | `ciena_tl1` |

This model produces a TL1 shelf inventory served by the [Ciena TL1
driver](/drivers/ciena-tl1/), not a Cisco config. Mix it into a Cisco fleet to test
multi-vendor handling:

```bash
--distribution "sm:35,md:35,lg:20,ciena-6500-tl1:10"
```

## Sizing disk

Disk usage is dominated by the large buckets. A default 50k fleet (40/40/15/5) is modest, but
a fleet skewed to `5xl`/`6xl` can need hundreds of GB. Plan capacity from your distribution —
see [Prerequisites](/installation/prerequisites/).

## Next

- [Manifest format](/generating-configs/manifest/)
- [Determinism & seeds](/generating-configs/determinism/)
