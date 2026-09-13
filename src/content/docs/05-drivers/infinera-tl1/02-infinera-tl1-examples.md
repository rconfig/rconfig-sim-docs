---
title: "Infinera TL1 examples"
description: "Worked rcfg-sim sessions against the infinera_tl1 driver: a paged RTRV-TIDMAP walk, routed collection by TID, and a Python client that reads a whole paged response."
sidebar:
  label: Infinera TL1 examples
  order: 7
slug: drivers/infinera-tl1-examples
---

Full sessions against the [`infinera_tl1` driver](/drivers/infinera-tl1/). Every transcript
here was captured from a running simulator rather than written by hand.

## Stand up a fleet

```bash
./bin/rcfg-sim-gen -count 2 -ip-count 1 -devices-per-ip 2 \
  -ip-base 127.0.0.1 -port-start 22400 \
  -distribution "infinera-dtnx-tl1:100" \
  -output-dir /tmp/inf -manifest /tmp/inf/manifest.csv

./bin/rcfg-sim --manifest /tmp/inf/manifest.csv --listen-ip 127.0.0.1 \
  --port-start 22400 --port-count 2 --ssh-auth none
```

## A paged walk

The greeting is `>`, not `<`:

```text
> ACT-USER::admin:1::"admin";

   INF-SJC-1000 26-09-12 19:53:37
M  1 COMPLD
   /*AUTHTYPE=LOCAL*/
   /*USERID=ADMIN*/
;

> RTRV-TIDMAP:::2;

   INF-SJC-1000 26-09-12 19:53:38
M  2 RTRV
   "::TID=STLTND1Y,NODEID=MA0353062311,ROUTERID=11.253.152.44"
   "::TID=LAXTND4Y,NODEID=MA1245743500,ROUTERID=11.253.152.33"
   ... eight more ...
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

Twenty-three nodes, ten to a block: two `RTRV` blocks then a `COMPLD`.

## Routed collection

```text
> RTRV-EQPT:STLTND1Y::3;

   INF-SJC-1000 26-09-12 19:54:26
M  3 COMPLD
   "CHASSIS-1::PROVISIONED,SN=FOCCBDD420D,SWVER=R21.3,IP=127.0.0.1:IS-NR"
   "SLOT-1::TCC2P,SN=LBCVCEMR4K01:IS-NR"
   "SLOT-2::TOM,SN=LBC1RPEAHZ02:IS-NR"
   ...
;

> RTRV-SW-VER:::4;

   INF-SJC-1000 26-09-12 19:54:27
M  4 COMPLD
   "SWVER=R21.3,LOADSTATE=ACTIVE"
;
```

Two things to notice. The routed reply's header says `INF-SJC-1000`, the gateway's system
name, not `STLTND1Y`. And the **next** command still correlates on its own CTAG, which is only
true because the client read the paged response to its end.

## Python: read a whole paged response

The important part is the loop. Reading to the first prompt is the bug this driver exists to
catch, so keep reading until a block arrives with a terminal code:

```python
import re, socket, time, paramiko

TERMINAL = re.compile(r"^M\s+\S+\s+(COMPLD|DENY|PRTL)\b", re.M)

def tl1(chan, cmd, timeout=10):
    """Send one command and read until a terminal block, however many pages it takes."""
    chan.send(cmd + "\r\n")
    out, deadline = "", time.time() + timeout
    while time.time() < deadline:
        if chan.recv_ready():
            out += chan.recv(65536).decode(errors="replace")
            if TERMINAL.search(out):
                return out          # the whole answer, every page of it
        time.sleep(0.1)
    raise TimeoutError(f"no terminal block for {cmd!r}; got {len(out)} bytes")

sock = socket.create_connection(("127.0.0.1", 22400), 10)
t = paramiko.Transport(sock)
t.connect()
try:
    t.auth_none("admin")
except Exception:
    pass
chan = t.open_session(); chan.invoke_shell(); time.sleep(0.5); chan.recv(65536)

tl1(chan, 'ACT-USER::admin:1::"admin";')
tidmap = tl1(chan, "RTRV-TIDMAP:::2;")
tids = re.findall(r"TID=([A-Z0-9]+),", tidmap)
print(len(tids), "nodes")                 # more than 10, or the read stopped early

for i, tid in enumerate(tids, start=10):
    inv = tl1(chan, f"RTRV-EQPT:{tid}::{i};")
t.close()
```

:::tip[The test that matters]
Assert two things, not one: that the node count is **greater than ten**, and that the command
**after** the paged one still succeeds. The second is what proves the socket was left clean;
the first alone passes even when the leftover blocks are still queued.
:::

## Failure modes worth reproducing

| Symptom | Cause |
|---|---|
| Session hangs on connect | Client waiting for `<`. A DTN-X presents `>` |
| Exactly ten nodes found | Read stopped at the first prompt |
| Every command after the first fails CTAG correlation | Same cause: unread blocks are answering the next command |
| Routed collection rejected as a SID mismatch | Client comparing the header SID to the addressed TID, which never matches here |
