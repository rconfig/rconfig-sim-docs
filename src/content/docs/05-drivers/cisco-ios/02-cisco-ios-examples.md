---
title: "Cisco IOS driver — worked examples"
description: "Complete worked rcfg-sim Cisco IOS sessions: full SSH transcripts with real show version, show running-config, and show inventory output, plus bash, expect, and Python (Netmiko/Paramiko) automation."
sidebar:
  label: Cisco IOS examples
  order: 3
slug: drivers/cisco-ios-examples
---

End-to-end, copy-paste examples for the [`cisco_ios` driver](/drivers/cisco-ios/).

## Start the simulator

Every example below talks to a running simulator. Generate a small all-Cisco fleet on
loopback and start the server first — leave it running in its own terminal.

```bash
# 1. Generate 100 Cisco IOS devices on 127.0.0.1, ports 12000-12099
./bin/rcfg-sim-gen \
  --count 100 \
  --output-dir /tmp/rcfg-test/configs \
  --manifest /tmp/rcfg-test/manifest.csv \
  --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 100 \
  --seed 42 \
  --distribution "sm:40,md:40,lg:15,xl:5"

# 2. Start the SSH server
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 \
  --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv \
  --host-key /tmp/rcfg-test/hostkey \
  --metrics-addr 127.0.0.1:9100
```

Default credentials are `admin` / `admin`, enable password `enable123`. To exercise the
[larger config tiers](/generating-configs/size-buckets/) or
[fault injection](/faults/overview/), adjust `--distribution` or add `--fault-*` flags here.

## A full interactive session

With the server running, connect with a plain SSH client and drive a complete collection
sequence:

```bash
sshpass -p admin ssh -T \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12000
```

```text
rtr-msp-hq-1000 line 0 is now available

rtr-msp-hq-1000>terminal length 0
rtr-msp-hq-1000>enable
Password: enable123
rtr-msp-hq-1000#show version
```

### `show version`

The driver returns a canned IOS 15.x block with the device's own hostname and
deterministic serial number substituted:

```text
Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.5(3)M7, RELEASE SOFTWARE (fc2)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2018 by Cisco Systems, Inc.
Compiled Wed 14-Mar-18 16:23 by prod_rel_team

ROM: System Bootstrap, Version 15.0(1r)M16, RELEASE SOFTWARE (fc1)

rtr-msp-hq-1000 uptime is 12 weeks, 3 days, 11 hours, 29 minutes
System returned to ROM by power-on
System restarted at 11:42:13 UTC Mon Mar 10 2025
System image file is "flash0:c2900-universalk9-mz.SPA.155-3.M7.bin"
Last reload type: Normal Reload
Last reload reason: power-on

cisco CISCO2901/K9 (revision 1.0) with 491520K/32768K bytes of memory.
Processor board ID FTX1840Q0AB
2 Gigabit Ethernet interfaces
DRAM configuration is 64 bits wide with parity enabled.
255K bytes of non-volatile configuration memory.
250880K bytes of ATA System CompactFlash 0 (Read/Write)

... (license + technology-package block) ...

Configuration register is 0x2102
```

The `Processor board ID` here is byte-for-byte the same serial reported by `show inventory`,
so correlation tooling sees one consistent serial per device.

### `show running-config`

```text
rtr-msp-hq-1000#show running-config
```

Streams the device's full generated config — anywhere from ~30 KB (`sm`) to ~128 MB (`6xl`),
delivered [zero-copy from `mmap`](/getting-started/concepts/#zero-copy-config-delivery).
`show startup-config` returns the identical bytes.

### `show inventory`

```text
rtr-msp-hq-1000#show inventory
NAME: "CISCO2901/K9", DESCR: "Cisco 2901 Integrated Services Router, rtr-msp-hq-1000"
PID: CISCO2901/K9      , VID: V07 , SN: FTX1840Q0AB

NAME: "C2901 Mother board 2FE, integrated VPN and 4W", DESCR: "C2901 Motherboard with 2 GE and integrated VPN"
PID: C2901-MB          , VID: V06 , SN: FTX1840Q0AB-MB

NAME: "Power Supply Module 0", DESCR: "Cisco 2901 AC Power Supply"
PID: PWR-2901-AC       , VID: V01 , SN: FTX1840Q0AB-PS

NAME: "Gi0/0/0", DESCR: "Integrated Gigabit Ethernet Interface"
PID: CISCO2901/K9      , VID: V01 , SN:

NAME: "Gi0/0/1", DESCR: "Integrated Gigabit Ethernet Interface"
PID: CISCO2901/K9      , VID: V01 , SN:
```

### Closing the session

```text
rtr-msp-hq-1000#exit          ← drops from enable mode back to user mode
rtr-msp-hq-1000>exit          ← closes the session
```

## Command abbreviation

Cisco-style unique-prefix matching works just like the real CLI:

```text
rtr-msp-hq-1000#sh ver        → show version
rtr-msp-hq-1000#sh run        → show running-config
rtr-msp-hq-1000#sh inv        → show inventory
rtr-msp-hq-1000#term len 0    → terminal length 0
```

## Error cases

These are useful for testing how your tooling reacts to non-happy paths:

```text
rtr-msp-hq-1000#show ip route
% Invalid input detected at '^' marker.

rtr-msp-hq-1000#en
% Ambiguous command:  ""          ← "en" matches both "enable" and "end"

rtr-msp-hq-1000>enable
Password: wrongpass
% Access denied
```

`configure terminal`, `write memory`, and anything else outside the
[supported set](/drivers/cisco-ios/#supported-commands) return the invalid-input message —
the simulator never mutates config.

## Automation

### Bash + sshpass (non-interactive)

The pattern from the Quickstart — pipe a heredoc of commands:

```bash
sshpass -p admin ssh -T \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12000 <<'CMDS'
terminal length 0
enable
enable123
show running-config
exit
exit
CMDS
```

### Pull configs from a whole range

Loop over a port range and save each running-config to a file:

```bash
for port in $(seq 12000 12099); do
  sshpass -p admin ssh -T \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    admin@127.0.0.1 -p "$port" <<'CMDS' > "config-${port}.txt"
terminal length 0
enable
enable123
show running-config
exit
exit
CMDS
done
```

### expect (handles the enable prompt)

```tcl
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  admin@127.0.0.1 -p 12000
expect "password:" { send "admin\r" }
expect ">"         { send "terminal length 0\r" }
expect ">"         { send "enable\r" }
expect "Password:" { send "enable123\r" }
expect "#"         { send "show running-config\r" }
expect "#"         { send "exit\r" }
expect ">"         { send "exit\r" }
expect eof
```

### Python — Netmiko

Netmiko's `cisco_ios` device type drives the simulator out of the box:

```python
from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "127.0.0.1",
    "port": 12000,
    "username": "admin",
    "password": "admin",
    "secret": "enable123",   # enable-mode password
}

with ConnectHandler(**device) as conn:
    conn.enable()
    print(conn.send_command("show version"))
    running = conn.send_command("show running-config")
    print(f"pulled {len(running)} bytes")
```

### Python — Paramiko (raw channel)

When you want full control of the byte stream:

```python
import paramiko, time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("127.0.0.1", port=12000, username="admin", password="admin",
               look_for_keys=False, allow_agent=False)

chan = client.invoke_shell()
for cmd in ["terminal length 0\n", "enable\n", "enable123\n",
            "show running-config\n", "exit\n", "exit\n"]:
    chan.send(cmd)
    time.sleep(0.5)

print(chan.recv(10_000_000).decode(errors="replace"))
client.close()
```

## Testing resilience

Layer in [fault injection](/faults/overview/) to see how these scripts behave against a
flaky fleet — e.g. add `--fault-rate 0.1 --fault-types "auth_fail,disconnect_mid"` to the
server and re-run the bulk pull above. See the [fault examples](/faults/examples/).

## See also

- [Cisco IOS driver reference](/drivers/cisco-ios/) — the full command table and behaviour
- [Ciena TL1 examples](/drivers/ciena-tl1-examples/) — the multi-vendor counterpart
- [Load-test scenarios](/examples/scenarios/) — scaling these patterns to 50k devices
