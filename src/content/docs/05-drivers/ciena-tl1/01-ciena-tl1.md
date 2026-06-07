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

Any other verb after login returns `DENY` with `ICNV` (input, command not valid). The exact
TL1 block formatting (`COMPLD`/`DENY` headers, the SID and timestamp) is produced by the
driver; unlike Cisco output, the TL1 wire bytes are not hashed by a determinism test.

## Generating Ciena devices

Add the [`ciena-6500-tl1`](/generating-configs/size-buckets/) model to your distribution:

```bash
--distribution "sm:40,md:40,lg:10,ciena-6500-tl1:10"
```

The generator writes these rows with `vendor=Ciena` and `template=ciena_tl1` in the
[manifest](/generating-configs/manifest/), and the server selects this driver for them.

## SSH authentication

`ciena_tl1` returns `RequiresSSHAuth() == false`. Under
[`--ssh-auth=driver`](/running-server/ssh-auth/), Ciena devices accept the SSH connection
without a transport password and rely on `ACT-USER` for authentication — exactly as the real
platform does. This is the mode to use for realistic mixed Cisco + Ciena fleets.

## Metrics

The driver emits `CmdTL1ActUser`, `CmdTL1RtrvEqpt`, `CmdTL1RtrvAlmAll`, `CmdTL1Deny`, and the
other `CmdTL1*` values on `rcfgsim_command_duration_seconds`. These appear once the driver is
active (they are not part of the pre-registered Cisco label set). See the
[metrics reference](/metrics/reference/).
