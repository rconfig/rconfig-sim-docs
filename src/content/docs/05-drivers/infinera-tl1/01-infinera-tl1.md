---
title: "Infinera DTN-X TL1 driver"
description: "The rcfg-sim infinera_tl1 driver: TL1 over SSH for the Infinera DTN-X, with paged RTRV-TIDMAP responses and routed replies that carry the system name."
sidebar:
  label: Infinera TL1 driver
  order: 6
slug: drivers/infinera-tl1
---

The `infinera_tl1` driver presents an **Infinera DTN-X** optical platform managed over TL1.
It shares the TL1 core with [Ciena](/drivers/ciena-tl1/) and
[Cisco ONS](/drivers/cisco-ons-tl1/) (block reading, `ACT-USER` parsing, response framing) and
differs everywhere the hardware does.

Two of those differences are why this driver exists. Both break clients written against
Ciena, and neither is reproducible without a simulator that models them.

## The prompt is `>`

Not `<`. A client that waits for `<` on a DTN-X waits until its read timeout.

## RTRV-TIDMAP is paged

A DTN-X returns one logical answer as **several blocks**. Every block but the last is coded
`RTRV` rather than `COMPLD`, and the prompt is written **between** blocks:

```text
> ACT-USER::admin:1::"admin";
> RTRV-TIDMAP:::2;

   INF-SJC-1000 26-09-12 19:53:38
M  2 RTRV
   "::TID=STLTND1Y,NODEID=MA0353062311,ROUTERID=11.253.152.44"
   ... nine more records in this block ...
;

>
   INF-SJC-1000 26-09-12 19:53:38
M  2 RTRV
   ... ten more ...
;

>
   INF-SJC-1000 26-09-12 19:53:38
M  2 COMPLD
   "::TID=TUSTNN2Y,NODEID=MA8953593801,ROUTERID=11.253.152.64"
;

>
```

Ten records per block. The failure this reproduces is **not** a truncated list:

:::caution[Why the prompts matter]
A client that reads "until the prompt" gets block one, returns it as the whole answer, and
leaves blocks 2..N sitting in the socket. Those then arrive as the reply to its **next**
command, which fails CTAG correlation, and so does every command after it. One paged response
silently desyncs the rest of the session.
:::

Generated nodes carry **12 to 30** remote nodes, deliberately more than one page, so the
paging path is always exercised. A fleet that never pages cannot regression-test the fix.

## Routed replies carry the system name

A DTN-X relaying a command for another node answers under its **own** system name:

```text
> RTRV-EQPT:STLTND1Y::3;

   INF-SJC-1000 26-09-12 19:54:26
M  3 COMPLD
   "CHASSIS-1::PROVISIONED,SN=FOCCBDD420D,SWVER=R21.3,IP=127.0.0.1:IS-NR"
   ...
;
```

The header says `INF-SJC-1000` even though the command addressed `STLTND1Y`. A client cannot
confirm routing by comparing the header SID to the TID it asked for, the way it can on a 6500.
This is real behaviour, it looks like a bug, and `TestInfineraRoutedResponseKeepsSystemName`
pins it so a well-meaning change cannot "fix" it into Ciena's behaviour.

## Records

```text
"::TID=CSVLTNFCO1Y,NODEID=MA4623110007,ROUTERID=11.253.152.33"
```

Keyword fields with an **empty AID**. TIDs are opaque alphanumeric names, not readable site
labels. `ROUTERID` is shaped like an address but is a routing identifier, so a client should
not store it as a management IP.

## Commands

| Command | Behaviour |
|---|---|
| `ACT-USER::user:ctag::pass;` | In-band login; `DENY PLNA` before it succeeds |
| `RTRV-TIDMAP` | The remote nodes behind this one, **paged** |
| `RTRV-EQPT` | Chassis inventory, streamed zero-copy; routed by TID |
| `RTRV-ALM-ALL` | Active alarms |
| `RTRV-COND-ALL` | Standing conditions |
| `RTRV-SW-VER` | Software version |
| `RTRV-SYS` | System identity |

Any other verb after login returns `DENY` with `ICNV`.

## Generating Infinera devices

```bash
./bin/rcfg-sim-gen -count 2 -ip-count 1 -devices-per-ip 2 \
  -ip-base 127.0.0.1 -port-start 22400 \
  -distribution "infinera-dtnx-tl1:100" \
  -output-dir /tmp/inf -manifest /tmp/inf/manifest.csv
```

Manifest rows carry `vendor=Infinera, template=infinera_tl1`. Mix with other models in one
run, e.g. `--distribution "infinera-dtnx-tl1:50,cisco-ons15454-tl1:50"`.

See [worked examples](/drivers/infinera-tl1-examples/) for full sessions.
