---
title: "Device profiles"
description: "Pin a fixed misbehaviour — hang, latency, refuse or disconnect — to specific rConfig-sim devices, chosen by seed or in the manifest, so the same devices misbehave on every run."
sidebar:
  label: Device profiles
  order: 4
slug: faults/device-profiles
---

[Faults](/faults/overview/) are random per event across the whole fleet. A **device profile**
is the opposite: a fixed way one device misbehaves on every session. A test can say "these 3
devices hang" and then check what your tooling did with exactly those devices.

## Profiles

| Profile | What it simulates | What the client sees |
|---|---|---|
| `hang:<duration>` | A device that stops responding mid-session | Login succeeds, then the first command gets no output for `<duration>` (e.g. `3600s`, `2h`). Commands sent meanwhile are answered, in order, once the hang ends. Every new session hangs again. |
| `latency:<min>-<max>` | A slow device or a long WAN path | Every command waits uniform `[min, max]` (e.g. `200-800ms`, `1s-3s`, or a fixed `500ms`). This replaces [`--response-delay-ms-min/max`](/running-server/timing/) for that device. |
| `refuse` | A dead or rate-limiting SSH daemon | TCP connects, then closes before the SSH handshake |
| `disconnect` | A device that always drops mid-transfer | Every config stream (e.g. `show running-config`) is cut part way, as [`disconnect_mid`](/faults/fault-types/#disconnect_mid) at rate 1 |

In a latency range, a bare number on the left takes the unit on the right, so `200-800ms`
means 200 ms to 800 ms.

Profiles work for every [driver](/drivers/overview/): Cisco IOS, Junos and the TL1
personalities.

## Assigning profiles to a share of the fleet

`--device-profiles` takes comma-separated `profile@percent` items:

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --device-profiles "hang:3600s@3%,latency:200-800ms@10%" \
  --profile-seed 42
```

| Flag | Default | Purpose |
|---|---|---|
| `--device-profiles` | `""` (off) | `profile@percent,...` — which profiles, and what share of the fleet gets each |
| `--profile-seed` | `42` | Decides which devices are picked |

Which devices get which profile depends only on `--profile-seed` and the device's hostname.
The same seed picks the same devices on every run and on every simulator instance, however the
fleet is split across IPs. Percentages may add up to at most 100, and no device gets two
profiles.

### Finding the affected devices

At startup the simulator logs one `device profile active` line per profile, with the device
count and up to 50 hostnames:

```json
{"level":"INFO","msg":"device profile active","profile":"hang:1h0m0s","devices":3,"hostnames":"rtr-msp-hq-1012,rtr-lax-br-1047,rtr-nyc-dc-1083","hostnames_truncated":false}
```

Use these hostnames to find the devices in your tooling. `hostnames_truncated=true` means more
than 50 devices have that profile.

## Pinning a profile to one device

The manifest takes an optional 11th column, `profile`, holding one profile **without** a
percentage:

```csv
hostname,ip,port,vendor,template,username,password,enable_password,config_file,size_bucket,profile
rtr-msp-hq-1000,127.0.0.1,12000,Cisco,cisco_ios,admin,admin,enable123,/tmp/rcfg-test/configs/device-00000.cfg,md,hang:7200s
rtr-msp-hq-1001,127.0.0.1,12001,Cisco,cisco_ios,admin,admin,enable123,/tmp/rcfg-test/configs/device-00001.cfg,md,
```

- A value in the column overrides `--device-profiles` for that device.
- An empty value leaves the device to `--device-profiles`.
- Manifests without the column load as before. The generator does not write it; add it by hand.
- An invalid value stops the simulator at startup, naming the device.

See the [manifest schema](/reference/manifest-schema/).

## Session cap and hangs

The simulator closes every session after `--max-session` (default `5m`). For a `hang` device
the cap is extended by the hang, so a 2-hour hang is not cut at 5 minutes.

Every other session keeps the cap, including slow `latency` devices. If a slow device's whole
session runs past 5 minutes, raise the cap or the simulator, not the client under test, ends
the session:

```bash
--device-profiles "latency:2s-5s@10%" --max-session 15m
```

A hang also ends early when the client disconnects or the simulator
[shuts down](/running-server/graceful-shutdown/).

## Metrics

Profiles reuse the existing metrics. No new labels are added:

| Profile | Shows up as |
|---|---|
| `refuse` | `rcfgsim_sessions_total{result="error"}` |
| `disconnect` | `rcfgsim_sessions_total{result="disconnect"}` and `rcfgsim_faults_injected_total{type="disconnect_mid"}` |
| `hang` | Long sessions in `rcfgsim_session_duration_seconds` |
| `latency` | Slow commands in `rcfgsim_command_duration_seconds` |

See the [metrics reference](/metrics/reference/).

## Profiles or faults?

| You want | Use |
|---|---|
| A realistic random share of failures across the fleet | [`--fault-rate` / `--fault-types`](/faults/overview/) |
| The same named devices misbehaving on every run, to assert on them | Device profiles |

The two combine: a profiled device still rolls any enabled faults, except a `refuse` device,
which closes before any fault can fire.
