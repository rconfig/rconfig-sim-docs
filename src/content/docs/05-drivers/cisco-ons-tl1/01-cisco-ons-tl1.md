---
title: "Cisco ONS 15454 TL1 driver"
description: "The rcfg-sim cisco_ons_tl1 driver: TL1 over SSH for the Cisco ONS 15454, with positional RTRV-MAP-NETWORK records and ENE terminology."
sidebar:
  label: Cisco ONS TL1 driver
  order: 8
slug: drivers/cisco-ons-tl1
---

The `cisco_ons_tl1` driver presents a **Cisco ONS 15454** multiservice transport platform
managed over TL1. It shares the TL1 core with [Ciena](/drivers/ciena-tl1/) and
[Infinera](/drivers/infinera-tl1/).

:::caution[Built from documentation, not from a capture]
Unlike the Ciena and Infinera drivers, this one was **not** built from a session capture. It
comes from the Cisco ONS SONET TL1 Command Guide R9.1 §21.68 and Oracle's ONS 15454 TL1
reference. Documented is better than invented, and much weaker than seen on hardware. Treat
anything it produces as a starting point, and please
[open an issue](https://github.com/rconfig/rconfig-sim/issues) with a real capture if you have
access to a node, so it can be corrected.
:::

## Cisco calls them ENEs

The elements behind a gateway are **ENEs** (End NEs) in Cisco's vocabulary, where Ciena says
RNEs. Same idea, different word. The [glossary](/reference/glossary/) has all three vendors'
terms side by side.

## Records are positional

This is the third distinct neighbour grammar of the three drivers, and the one a shared
"split on commas, read `key=value`" parser cannot handle: there are **no keywords at all**.

```text
< ACT-USER::admin:1::"admin";
< RTRV-MAP-NETWORK:::2;

   ONS-BWI-1001 26-09-12 19:54:13
M  2 COMPLD
   "172.20.222.225,ONS-BWI-1001,15454"
   "172.20.222.224,TID-199,15454"
   "172.20.222.223,TID-452,15454"
   "172.20.222.222,TID-596,15454"
   "172.20.222.221,TID-933,15454"
;
```

Each record is `"<IPADDR>,<NODENAME>,<PRODUCT>"`.

**`NODENAME` is the TID.** **`PRODUCT`** is the platform type, and this is the only TL1 vendor
of the three that hands a client a real model per element instead of leaving it to copy the
gateway's.

**The gateway lists itself first.** The other two vendors do not. A client that does not drop
its own record will reconcile the gateway as an element behind itself.

## UNKNOWN is not a model

The vendor documentation notes `PRODUCT` comes back as `UNKNOWN` for a node running a
different software version. Every seventh element is emitted that way deliberately:

```text
   "172.20.222.219,TID-338,UNKNOWN"
```

A client that stores `UNKNOWN` as a device model has a bug, and this is how it gets caught. A
gateway with fewer than seven ENEs will not show one, so generate a few before looking.

## Commands

| Command | Behaviour |
|---|---|
| `ACT-USER::user:ctag::pass;` | In-band login; `DENY PLNA` before it succeeds |
| `RTRV-MAP-NETWORK` | The gateway and the ENEs behind it, positional records |
| `RTRV-EQPT` | Shelf inventory, streamed zero-copy; routed by TID |
| `RTRV-ALM-ALL` | Active alarms |
| `RTRV-COND-ALL` | Standing conditions |
| `RTRV-SW-VER` | Software version |

Any other verb after login returns `DENY` with `ICNV`. The prompt is `<`, as on Ciena.

## Generating Cisco ONS devices

```bash
./bin/rcfg-sim-gen -count 2 -ip-count 1 -devices-per-ip 2 \
  -ip-base 127.0.0.1 -port-start 22410 \
  -distribution "cisco-ons15454-tl1:100" \
  -output-dir /tmp/ons -manifest /tmp/ons/manifest.csv
```

Each gateway fronts 3 to 8 ENEs. Manifest rows carry
`vendor=Cisco, template=cisco_ons_tl1` — note that `cisco_ons_tl1` is a different driver from
`cisco_ios`, and both can appear in one fleet.

See [worked examples](/drivers/cisco-ons-tl1-examples/) for full sessions.
