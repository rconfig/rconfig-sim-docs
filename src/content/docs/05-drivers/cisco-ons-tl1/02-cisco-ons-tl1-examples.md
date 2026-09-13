---
title: "Cisco ONS TL1 examples"
description: "Worked rcfg-sim sessions against the cisco_ons_tl1 driver: reading positional RTRV-MAP-NETWORK records, dropping the gateway's own row, and handling UNKNOWN products."
sidebar:
  label: Cisco ONS TL1 examples
  order: 9
slug: drivers/cisco-ons-tl1-examples
---

Full sessions against the [`cisco_ons_tl1` driver](/drivers/cisco-ons-tl1/). Remember this
driver is built from vendor documentation rather than a hardware capture; see the caveat on
that page.

## Stand up a fleet

```bash
./bin/rcfg-sim-gen -count 2 -ip-count 1 -devices-per-ip 2 \
  -ip-base 127.0.0.1 -port-start 22410 \
  -distribution "cisco-ons15454-tl1:100" \
  -output-dir /tmp/ons -manifest /tmp/ons/manifest.csv

./bin/rcfg-sim --manifest /tmp/ons/manifest.csv --listen-ip 127.0.0.1 \
  --port-start 22410 --port-count 2 --ssh-auth none
```

## A network map walk

```text
< ACT-USER::admin:1::"admin";

   ONS-BWI-1001 26-09-12 19:54:12
M  1 COMPLD
   /*AUTHTYPE=LOCAL*/
   /*USERID=ADMIN*/
;

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

The first record is the gateway itself.

## Routed collection

```text
< RTRV-EQPT:TID-199:ALL:3;

   TID-199 26-09-12 19:54:20
M  3 COMPLD
   "SLOT-1::PROVISIONED,TYPE=15454-TCC2P,SN=LBCVCEMR4K01,STATE=IS-NR"
   ...
;
```

Unlike Infinera, an ONS gateway **does** echo the addressed TID in the response header, so a
client can confirm the reply came from the ENE rather than from the gateway answering locally.

## Python: parse positional records

The parser must be positional and must reject anything carrying `=`, or a keyword payload from
another vendor turns into an element named `REACHABLE=YES`:

```python
import ipaddress, re

def parse_map_network(payload: str, own_sid: str):
    """Yield (tid, ip, model) for every ENE, excluding the gateway's own row."""
    for line in payload.splitlines():
        m = re.search(r'"([^"]*)"', line)
        if not m:
            continue
        fields = [f.strip() for f in m.group(1).split(",")]
        if len(fields) < 3 or "=" in m.group(1):
            continue                      # not a positional record
        ip, nodename, product = fields[:3]
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            continue                      # first field must be an address
        if nodename.upper() == own_sid.upper():
            continue                      # the gateway lists itself; drop it
        model = None if product.upper() == "UNKNOWN" else product
        yield nodename.upper(), ip, model
```

Three guards, each for a real failure:

| Guard | Without it |
|---|---|
| Reject records containing `=` | An Infinera or Ciena payload parses into nonsense elements |
| Require field 0 to be an IP | Any three comma-separated values become an element |
| Drop the row matching the gateway's SID | The gateway becomes an element behind itself |

## UNKNOWN products

```text
   "172.20.222.219,TID-338,UNKNOWN"
```

Every seventh element is emitted this way, matching the vendor documentation's note that
`PRODUCT` is `UNKNOWN` for a node on a different software version. Store `None`, not the
string. A gateway with fewer than seven ENEs will not show one.
