---
title: "Network setup & IP aliases"
description: "Create the IP aliases that rcfg-sim instances bind to, using the deploy/ip-aliases.sh helper, for high-density multi-IP simulation on a single host."
sidebar:
  label: Network setup
  order: 4
slug: installation/network-setup
---

A full 50k install presents **20 IPs × 2,500 ports**. Those IPs are ordinary aliases on a
single interface — no extra NICs required. rcfg-sim ships an idempotent helper to manage them.

## The address plan

The defaults assume a contiguous IP range starting at `10.50.0.1`, each IP serving ports
`10000–12499` (2,500 ports). The generator's `--ip-base`, `--ip-count`,
`--devices-per-ip`, and `--port-start` flags define this plan, and it is written into the
[manifest](/generating-configs/manifest/) so the server knows exactly what to bind.

```text
single host
├── 10.50.0.1   ports 10000-12499 → 2,500 devices
├── 10.50.0.2   ports 10000-12499 → 2,500 devices
└── … 10.50.0.20 ports 10000-12499 → 2,500 devices
                                      ───────────────
                                      50,000 devices total
```

## Creating the aliases

Use the Makefile wrappers around `deploy/ip-aliases.sh`:

```bash
sudo make deploy-aliases      # add the configured IP aliases
sudo make remove-aliases      # remove them again
```

The script is **idempotent** — re-running it will not create duplicates — and works against
either the loopback interface (for a self-contained rig) or a routable interface (when an
external NCM platform must reach the simulated fleet).

## Loopback vs routable

- **Loopback aliases** keep everything on one host: the simulator and the tool under test
  run side by side. Great for CI and single-box benchmarking.
- **Routable aliases** expose the fleet to other hosts on the network, so a separate
  collector or NCM server can connect across the wire — closer to a real deployment.

## Verifying

```bash
ip -brief addr show          # confirm the aliases are present
ss -tlnp | grep rcfg-sim     # confirm listeners are bound (once running)
```

## Next

With aliases in place and configs generated, start the instances — see
[System install](/installation/system-install/) and
[Running the server](/running-server/overview/).
