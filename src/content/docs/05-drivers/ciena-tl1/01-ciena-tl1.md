---
title: "Ciena 6500 TL1 driver"
description: "The rcfg-sim ciena_tl1 driver: TL1 over SSH for the Ciena 6500 optical platform, with ACT-USER in-band login and RTRV-* retrieval commands."
sidebar:
  label: Ciena TL1 driver
  order: 4
slug: drivers/ciena-tl1
---

The `ciena_tl1` driver presents a **Ciena 6500 7-slot optical** platform managed over
**TL1** (Transaction Language 1) carried on SSH. It exists to test multi-vendor handling in
tooling that must speak more than Cisco IOS, and it demonstrates how different the
[driver framework](/drivers/overview/) lets vendors be.

## How TL1 differs from IOS

- The prompt is a bare `<`, used both as the greeting and the per-command prompt.
- Commands are terminated by `;` (not a newline) and may span multiple physical lines.
- Authentication is **in-band**: the SSH transport accepts the connection, then the client
  must send a valid `ACT-USER` before anything else works.
- Responses are TL1 blocks: a header with the system id (SID) and timestamp, then
  `COMPLD` (success) or `DENY` (failure) with a four-character error code.

## The login gate

Until a successful `ACT-USER`, every command returns `DENY` with `PLNA` (login failure). The
login command's grammar is:

```text
ACT-USER::<username>:<ctag>::<password>;
```

The same accept-any-when-empty credential semantics as the SSH layer apply: an empty
configured password accepts any, otherwise username and password must match. On success the
device returns a `COMPLD` block and unlocks the `RTRV-*` verbs.

## Supported commands

| Command | Behaviour |
|---|---|
| `ACT-USER::user:ctag::pass;` | In-band login; `COMPLD` on success, `DENY PLNA` on failure |
| `RTRV-EQPT` | Shelf inventory — streamed zero-copy from the generated payload, or a small synthesized block if none exists |
| `RTRV-ALM-ALL` | Active alarms (canned) |
| `RTRV-COND-ALL` | Standing conditions (canned) |
| `RTRV-ACTIVE-USER` | The active user session |
| `RTRV-SW-VER` | Software version |
| `RTRV-SYS` | System identity (SID, type, shelf serial) |
| `RTRV-NBR` | Lists the Remote NEs reachable through a Gateway NE — see [GNE / RNE](#gateway-and-remote-nes-gne--rne) |

Any other verb after login returns `DENY` with `ICNV` (input, command not valid). The exact
TL1 block formatting (`COMPLD`/`DENY` headers, the SID and timestamp) is produced by the
driver; unlike Cisco output, the TL1 wire bytes are not hashed by a determinism test.

## Gateway and Remote NEs (GNE / RNE)

Real optical networks are reached through a **Gateway NE (GNE)** — the node you SSH into —
which fronts several **Remote NEs (RNEs)** that have no direct management access of their own.
You address an RNE by putting its **TID** (target identifier) in the command's TID field; the
GNE routes the command across its control network to that RNE and returns the reply with the
RNE's TID as the response SID.

The same `ciena_tl1` driver handles both. Whether a device has RNEs depends only on which
generator model produced it:

| Model | Topology |
|---|---|
| `ciena-6500-tl1` | Standalone node (a GNE with no RNEs) |
| `ciena-6500-tl1-gne` | Gateway NE fronting 2–5 RNEs, whose inventories are generated into the device's config |

After login, `RTRV-NBR` lists the RNEs reachable through the GNE:

```text
RTRV-NBR:ALL:2;

   CIENA-LAX-1001 26-06-07 11:42:13
M  2 COMPLD
   "RNE-LIMERICK:PROTOCOL=OSC,REACHABLE=YES,STATE=IS-NR"
   "RNE-GALWAY:PROTOCOL=OSC,REACHABLE=YES,STATE=IS-NR"
;
```

You then address any RNE by TID. The same verb set works locally or against an RNE:

| Form | Target | Example |
|---|---|---|
| `VERB::AID:CTAG;` (empty TID) | the GNE itself | `RTRV-EQPT::ALL:100;` |
| `VERB:TID:CTAG;` (TID set) | the named RNE | `RTRV-EQPT:RNE-LIMERICK:3;` |

A TID that is empty, `ALL`, or the GNE's own SID is treated as **local**; an unknown or
unreachable RNE TID returns `DENY` with `IIAC` (invalid access identifier). Both the
TID-addressed short form `VERB:TID:CTAG;` and the strict `VERB::AID:CTAG;` form are accepted.
The standalone model answers `RTRV-NBR` with an empty list and returns `IIAC` for any RNE TID.

GNE devices stream the targeted RNE's inventory
[zero-copy from `mmap`](/getting-started/concepts/#zero-copy-config-delivery) just like a
local `RTRV-EQPT`; the smaller per-RNE responses (alarms, conditions, sys, version) are
synthesized with the RNE's TID as the SID.

## Generating Ciena devices

Add a Ciena model to your distribution — `ciena-6500-tl1` for standalone nodes,
`ciena-6500-tl1-gne` for Gateway NEs with RNEs behind them:

```bash
--distribution "sm:40,md:40,lg:10,ciena-6500-tl1:5,ciena-6500-tl1-gne:5"
```

The generator writes these rows with `vendor=Ciena` and `template=ciena_tl1` in the
[manifest](/generating-configs/manifest/), and the server selects this driver for them. RNEs
are not separate manifest rows — they are reached only through their GNE.

## SSH authentication

`ciena_tl1` returns `RequiresSSHAuth() == false`. Under
[`--ssh-auth=driver`](/running-server/ssh-auth/), Ciena devices accept the SSH connection
without a transport password and rely on `ACT-USER` for authentication — exactly as the real
platform does. This is the mode to use for realistic mixed Cisco + Ciena fleets.

## Metrics

The driver emits `CmdTL1ActUser`, `CmdTL1RtrvEqpt`, `CmdTL1RtrvAlmAll`, `CmdTL1RtrvNbr`,
`CmdTL1Deny`, and the other `CmdTL1*` values on `rcfgsim_command_duration_seconds`. These
appear once the driver is active (they are not part of the pre-registered Cisco label set).
The TID a command targets is **not** a label — RNE addressing does not expand metric
cardinality. See the [metrics reference](/metrics/reference/).
