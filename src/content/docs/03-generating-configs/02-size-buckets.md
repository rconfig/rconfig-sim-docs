---
title: "Size buckets & the distribution flag"
description: "The rcfg-sim config size buckets (sm through 6xl plus the optical TL1 models) and how the --distribution flag controls the mix of config sizes across a simulated fleet."
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
--distribution "infinera-dtnx-tl1:100"   # an all-Infinera optical fleet
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

## Optical TL1 models

These produce TL1 inventories served by the TL1 drivers, not Cisco configs.

| Model | Approx size | Class | Driver |
|---|---|---|---|
| `ciena-6500-tl1` | ~1 KB | Ciena 6500 7-slot optical, standalone | [`ciena_tl1`](/drivers/ciena-tl1/) |
| `ciena-6500-tl1-gne` | ~7 KB | Ciena gateway fronting 2-5 Remote NEs | [`ciena_tl1`](/drivers/ciena-tl1/) |
| `infinera-dtnx-tl1` | ~8 KB | Infinera DTN-X fronting 12-30 remote nodes | [`infinera_tl1`](/drivers/infinera-tl1/) |
| `cisco-ons15454-tl1` | ~2 KB | Cisco ONS 15454 gateway fronting 3-8 End NEs | [`cisco_ons_tl1`](/drivers/cisco-ons-tl1/) |

The gateway models carry the inventories of every element behind them in one config, which is
why they are larger. An Infinera node gets 12 to 30 remotes deliberately: `RTRV-TIDMAP` pages
every ten records, so fewer than eleven would never exercise the paging path.

Mix them into a Cisco fleet to test multi-vendor handling:

```bash
--distribution "sm:35,md:35,lg:20,ciena-6500-tl1:10"
```

Or build a mixed optical fleet with no Cisco IOS at all:

```bash
--distribution "ciena-6500-tl1-gne:40,infinera-dtnx-tl1:40,cisco-ons15454-tl1:20"
```

## Sizing disk

Disk usage is dominated by the large buckets. A default 50k fleet (40/40/15/5) is modest, but
a fleet skewed to `5xl`/`6xl` can need hundreds of GB. Plan capacity from your distribution —
see [Prerequisites](/installation/prerequisites/).

## Next

- [Manifest format](/generating-configs/manifest/)
- [Determinism & seeds](/generating-configs/determinism/)
