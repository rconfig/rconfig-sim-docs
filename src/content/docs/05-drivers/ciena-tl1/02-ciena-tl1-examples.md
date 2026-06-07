---
title: "Ciena 6500 TL1 driver — worked examples"
description: "Complete worked rcfg-sim Ciena 6500 TL1 sessions over SSH: the ACT-USER login gate, RTRV-EQPT/ALM/COND/SYS responses with real COMPLD and DENY blocks, and Python automation."
sidebar:
  label: Ciena TL1 examples
  order: 5
slug: drivers/ciena-tl1-examples
---

End-to-end examples for the [`ciena_tl1` driver](/drivers/ciena-tl1/).

## Start the simulator

The Ciena model isn't in the default distribution, so generate a mixed Cisco + Ciena fleet
that includes it, then start the server with [`--ssh-auth driver`](/running-server/ssh-auth/)
so each vendor authenticates the way it really does. Leave the server running in its own
terminal.

```bash
# 1. Generate 200 devices including 10% Ciena 6500 TL1
./bin/rcfg-sim-gen --count 200 --output-dir /tmp/mix/configs \
  --manifest /tmp/mix/manifest.csv --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 200 --seed 42 \
  --distribution "sm:50,md:30,lg:10,ciena-6500-tl1:10"

# 2. Start the server — driver-aware SSH auth for the mixed fleet
./bin/rcfg-sim --listen-ip 127.0.0.1 --port-start 12000 --port-count 200 \
  --manifest /tmp/mix/manifest.csv --host-key /tmp/mix/hostkey \
  --ssh-auth driver --metrics-addr 127.0.0.1:9100
```

## Connect to a Ciena device

Find a Ciena port in the manifest (`template` column = `ciena_tl1`) and connect to it. With
[`--ssh-auth driver`](/running-server/ssh-auth/) the SSH transport accepts the connection
without a password — authentication happens **in-band** with `ACT-USER`.

```bash
ssh -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12001
```

On connect the device emits the bare TL1 prompt:

```text

<
```

:::note[TL1 syntax]
Commands are terminated by `;` (not a newline) and may span multiple lines. Responses are
TL1 blocks: a header line with the **SID** and a `YY-MM-DD HH:MM:SS` timestamp, then
`COMPLD` (success) or `DENY` (failure with a 4-character error code), ending in `;`.
:::

## The login gate

Any retrieval before a successful login is denied with `PLNA`:

```text
RTRV-SYS:::CTAG001;

   CIENA-LAX-1001 26-06-07 11:42:13
M  CTAG001 DENY
   PLNA
;
```

Log in with `ACT-USER::<user>:<ctag>::<pass>;`:

```text
ACT-USER::admin:CTAG002::admin;

   CIENA-LAX-1001 26-06-07 11:42:18
M  CTAG002 COMPLD
   /*AUTHTYPE=LOCAL*/
   /*USERID=ADMIN*/
;
```

The same [accept-any-when-empty](/running-server/ssh-auth/#password-semantics) semantics
apply: an empty configured password accepts any. After `COMPLD` the `RTRV-*` verbs unlock.

## Retrieving the shelf inventory

`RTRV-EQPT` streams the device's generated 6500 7-slot inventory
[zero-copy from `mmap`](/getting-started/concepts/#zero-copy-config-delivery) — deterministic
per `(seed, device)`:

```text
RTRV-EQPT::ALL:CTAG003;

   CIENA-LAX-1001 26-06-07 11:42:25
M  CTAG003 COMPLD
   "SHELF-1::PROVISIONED,TYPE=6500-7SLOT,SN=LBCQ7F3K1P,SWVER=12.4,IP=127.0.0.1:IS-NR"
   "SLOT-1:OTR2,CLEI=WMOTH4K2NP,SN=LBCQ7F3K1P01,PN=NTK547C:IS-NR"
   "SLOT-1-1::OPTIC=QSFP28,WL=1550.12,SN=LBCK9M2T4R01:IS-NR"
   "SLOT-1-2::OPTIC=CFP2,WL=1531.90,SN=LBCP3X8W2H02:IS-NR"
   "SLOT-2:WL3N,CLEI=WMOT8J3D0Q,SN=LBCR4T7Y2K02,PN=NTK583F:IS-NR"
   "SLOT-7::UNEQUIPPED:OOS-AUMA"
;
```

(The exact slots, card types, CLEI codes, optics, and wavelengths are generated from a bounded
catalog and are stable for a given seed.)

## The other RTRV verbs

### `RTRV-ALM-ALL` — active alarms

```text
RTRV-ALM-ALL:::CTAG004;

   CIENA-LAX-1001 26-06-07 11:42:30
M  CTAG004 COMPLD
   "SLOT-2:MN,CONTBUS,SA,,,,:\"Intermittent equipment communication\""
   "SLOT-7:MJ,T-LOS,NSA,,,,:\"Loss of signal\""
;
```

### `RTRV-COND-ALL` — standing conditions

```text
RTRV-COND-ALL:::CTAG005;

   CIENA-LAX-1001 26-06-07 11:42:34
M  CTAG005 COMPLD
   "SLOT-1:T-OPR-OCH,NEND,,,,,:\"Optical power received\""
;
```

### `RTRV-SW-VER` — software version

```text
RTRV-SW-VER:::CTAG006;

   CIENA-LAX-1001 26-06-07 11:42:38
M  CTAG006 COMPLD
   "SWVER=12.4,LOAD=12.4-GA,STATUS=ACTIVE"
;
```

### `RTRV-SYS` — system identity

```text
RTRV-SYS:::CTAG007;

   CIENA-LAX-1001 26-06-07 11:42:42
M  CTAG007 COMPLD
   "SID=CIENA-LAX-1001,TYPE=6500-7SLOT,SHELFSN=LBCQ7F3K1P"
;
```

### `RTRV-ACTIVE-USER` — active sessions

```text
RTRV-ACTIVE-USER:::CTAG008;

   CIENA-LAX-1001 26-06-07 11:42:46
M  CTAG008 COMPLD
   "ADMIN:ADMIN,ACTIVE"
;
```

## Error cases

An unrecognised verb after login returns `ICNV` (input, command not valid):

```text
RTRV-NONSENSE:::CTAG009;

   CIENA-LAX-1001 26-06-07 11:42:50
M  CTAG009 DENY
   ICNV
;
```

Bad credentials on `ACT-USER` return `DENY PLNA`, exactly like a pre-login retrieval.

## Gateway NE fronting Remote NEs (GNE / RNE)

The [`ciena-6500-tl1-gne`](/drivers/ciena-tl1/#gateway-and-remote-nes-gne--rne) model
emulates a **Gateway NE** that proxies TL1 to several **Remote NEs** reachable only through
it. Generate a small GNE fleet and serve it:

```bash
# A GNE fleet — each device fronts 2–5 RNEs
./bin/rcfg-sim-gen --count 5 --output-dir /tmp/gne/configs \
  --manifest /tmp/gne/manifest.csv --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 5 --seed 7 \
  --distribution "ciena-6500-tl1-gne:100"

./bin/rcfg-sim --listen-ip 127.0.0.1 --port-start 12000 --port-count 5 \
  --manifest /tmp/gne/manifest.csv --host-key /tmp/gne/hostkey --ssh-auth none
```

Connect to the GNE and log in, then **discover the RNEs** behind it with `RTRV-NBR`:

```text
ACT-USER::admin:1::admin;
RTRV-NBR:ALL:2;

   CIENA-LAX-1001 26-06-07 11:43:01
M  2 COMPLD
   "RNE-LIMERICK:PROTOCOL=OSC,REACHABLE=YES,STATE=IS-NR"
   "RNE-GALWAY:PROTOCOL=OSC,REACHABLE=YES,STATE=IS-NR"
;
```

Address an RNE by putting its TID in the TID field (`VERB:TID:CTAG;`). The reply comes back
with the **RNE's** TID as the response SID — note `RNE-LIMERICK`, not the GNE's `CIENA-LAX-1001`:

```text
RTRV-EQPT:RNE-LIMERICK:3;

   RNE-LIMERICK 26-06-07 11:43:08
M  3 COMPLD
   "SHELF-1::PROVISIONED,TYPE=6500-7SLOT,SN=LBC2K9F4P1,SWVER=12.4,IP=127.0.0.1:IS-NR"
   "SLOT-1:OTR2,CLEI=WMOTH4K2NP,SN=LBC2K9F4P101,PN=NTK547C:IS-NR"
   ...
;
```

Alarms (and the other verbs) work against an RNE the same way:

```text
RTRV-ALM-ALL:RNE-LIMERICK:4;

   RNE-LIMERICK 26-06-07 11:43:12
M  4 COMPLD
   "SLOT-2:MN,CONTBUS,SA,,,,:\"Intermittent equipment communication\""
;
```

GNE-own commands keep the empty-TID form and report the GNE's SID:

```text
RTRV-EQPT::ALL:100;

   CIENA-LAX-1001 26-06-07 11:43:18
M  100 COMPLD
   "SHELF-1::PROVISIONED,TYPE=6500-7SLOT,...:IS-NR"
;
```

An unknown or unreachable RNE TID is denied with `IIAC`:

```text
RTRV-EQPT:RNE-NOWHERE:9;

   CIENA-LAX-1001 26-06-07 11:43:22
M  9 DENY
   IIAC
;
```

:::tip[Collecting a whole GNE subtree]
A collector walks a GNE by issuing `RTRV-NBR` first, then iterating each returned RNE TID with
`RTRV-EQPT:<TID>:<ctag>;`. The standalone `ciena-6500-tl1` model behaves like a GNE with zero
RNEs — `RTRV-NBR` returns an empty `COMPLD` — so the same collection logic works for both.
:::

## Automation

### Python — Paramiko (read until `;`)

TL1 has no off-the-shelf Netmiko driver, so drive it over a raw Paramiko channel, reading
until the `;` terminator of each response:

```python
import paramiko, time

def tl1(chan, cmd):
    chan.send(cmd if cmd.endswith(";") else cmd + ";")
    buf = ""
    deadline = time.time() + 10
    while time.time() < deadline:
        if chan.recv_ready():
            buf += chan.recv(65535).decode(errors="replace")
            # a complete response ends with ';' on its own line
            if buf.rstrip().endswith(";"):
                break
        else:
            time.sleep(0.1)
    return buf

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("127.0.0.1", port=12001, username="admin", password="admin",
               look_for_keys=False, allow_agent=False)
chan = client.invoke_shell()
time.sleep(0.3); chan.recv(4096)              # consume the initial "<" prompt

print(tl1(chan, "ACT-USER::admin:C1::admin;"))
print(tl1(chan, "RTRV-EQPT::ALL:C2;"))
print(tl1(chan, "RTRV-ALM-ALL:::C3;"))
client.close()
```

### Python — walk a GNE's RNEs

Discover the RNEs with `RTRV-NBR`, then pull each one's inventory by TID. Reuses the `tl1()`
helper above:

```python
import re

tl1(chan, "ACT-USER::admin:1::admin;")
nbr = tl1(chan, "RTRV-NBR:ALL:2;")
rnes = re.findall(r'"(RNE-[A-Z0-9-]+):', nbr)   # ['RNE-LIMERICK', 'RNE-GALWAY', ...]

inventories = {"<local>": tl1(chan, "RTRV-EQPT::ALL:100;")}   # the GNE itself
for i, tid in enumerate(rnes, start=10):
    inventories[tid] = tl1(chan, f"RTRV-EQPT:{tid}:{i};")     # each RNE behind it
```

### Bash (one-shot)

Because TL1 commands are `;`-terminated you can pipe them in, but give the server a moment
between sends:

```bash
{ printf 'ACT-USER::admin:C1::admin;\n'; sleep 1; \
  printf 'RTRV-EQPT::ALL:C2;\n'; sleep 1; } | \
  ssh -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12001
```

## Mixed Cisco + Ciena fleets

Running with `--ssh-auth driver` is what makes a mixed fleet realistic: Cisco devices
challenge for an SSH password while Ciena devices accept the connection and rely on
`ACT-USER`. This is the configuration to use when testing whether your tooling correctly
handles **both** auth models — see [SSH auth modes](/running-server/ssh-auth/) and
[Using rcfg-sim with rConfig](/examples/using-with-rconfig/).

## See also

- [Ciena TL1 driver reference](/drivers/ciena-tl1/) — the full verb table and behaviour
- [Cisco IOS examples](/drivers/cisco-ios-examples/) — the Cisco counterpart
- [Fault injection](/faults/overview/) — TL1 config streams are subject to the same faults as Cisco
