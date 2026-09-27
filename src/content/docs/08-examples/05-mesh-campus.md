---
title: "Mesh campus scenario"
description: "The rcfg-sim mesh-campus scenario: three simulated devices (Arista EOS, Juniper Junos, Cisco IOS) with LLDP/CDP neighbours that agree end to end, for topology discovery testing."
sidebar:
  label: Mesh campus scenario
  order: 5
slug: examples/mesh-campus
---

`scenarios/mesh-campus/` in the repo is a small multi-vendor campus for testing
**topology discovery**, built for rConfig Mesh (LLDP/CDP). It is three devices, one per
vendor, whose neighbour and interface output agree end to end: every chassis ID a device
reports matches a MAC in its neighbour's `show interfaces`, so discovery can match identities
by MAC.

It needs no generator run. The scenario ships its own manifest, configs and
[command files](/running-server/command-files/).

## Devices

| Device | OS | Driver | Port | Chassis / base MAC | Mgmt IP (advertised) |
|---|---|---|---|---|---|
| core-01 | Arista EOS 4.31 | `cisco_ios` | 12700 | `5254.00aa.0101` (Management1) | 10.20.0.1 |
| dist-01 | Junos 22.4 | [`junos`](/drivers/junos/) | 12701 | `2c:6b:f5:aa:02:01` (fxp0) | 10.20.0.2 |
| access-01 | IOS 15.2 (C2960X) | `cisco_ios` | 12702 | `7c95.f3aa.0300` (Vlan1) | 10.20.0.3 |

Commands answered from files:

| Device | Commands |
|---|---|
| core-01 | `show lldp neighbors detail`, `show interfaces`, `show version` |
| dist-01 | `show lldp neighbors`, `show interfaces` |
| access-01 | `show cdp neighbors detail`, `show lldp neighbors detail`, `show interfaces` |

## Topology

| A side | B side | Protocol | Expected |
|---|---|---|---|
| core-01 Ethernet1 | dist-01 ge-0/0/0 | LLDP | bidirectional |
| core-01 Ethernet2 | access-01 GigabitEthernet0/1 | LLDP | bidirectional (exercises `Et2` / `Gi0/1` short names) |
| access-01 GigabitEthernet0/24 | ap-lobby-01 (not managed) | LLDP | unknown device, unidirectional |
| access-01 GigabitEthernet0/2 | router1 GigabitEthernet2 (a real lab router) | CDP | one-sided: the real router never sees the sim |

## Run it

The checked-in manifest targets a lab host. Set its `ip` column to the address your
collector reaches the sim on, and make the `config_file` paths absolute for your checkout.
Then:

```bash
./bin/rcfg-sim \
  --manifest scenarios/mesh-campus/manifest.csv \
  --listen-ip <SIM_IP> --port-start 12700 --port-count 3 \
  --commands-root scenarios/mesh-campus/commands \
  --password "" --enable-password ""
```

```text
$ ssh -p 12701 admin@<SIM_IP>
admin@dist-01> show lldp neighbors
Local Interface    Parent Interface    Chassis Id          Port info          System Name
ge-0/0/0           -                   52:54:00:aa:01:01   Ethernet1          core-01
```

## Playbook

The step-by-step walkthrough (starting the sim, adding the devices to rConfig, collecting,
the expected links, pitfalls and troubleshooting) is the scenario's
[PLAYBOOK.md](https://github.com/rconfig/rconfig-sim/blob/main/scenarios/mesh-campus/PLAYBOOK.md)
in the repo.

:::caution[Delete old sim devices before re-adding]
If earlier copies of these devices are still in rConfig, two records share the same MACs and
IPs and identity matching breaks. Delete the old records first.
:::

## Tested

The `TestMeshCampus_CommandFiles` integration test serves the scenario on loopback, runs
every file-backed command on every device, and checks each response byte for byte, along
with the prompts and the silent paging commands.
