---
title: "Glossary"
description: "Definitions of key rcfg-sim terms — driver, model, size bucket, manifest, fault injection, mmap zero-copy, and TL1 — for the network device SSH simulator."
sidebar:
  label: Glossary
  order: 4
slug: reference/glossary
---

Key terms used across this documentation.

**Bucket / size bucket** — a generator [model](#model) keyed by approximate config size
(`sm`, `md`, `lg`, `xl`, `2xl`–`6xl`, `ciena-6500-tl1`, `ciena-6500-tl1-gne`). Selected via
[`--distribution`](/generating-configs/size-buckets/).

**Determinism** — the property that a given [`--seed`](/generating-configs/determinism/)
produces byte-identical generator output across runs.

**Driver** — a vendor personality (`cisco_ios`, `ciena_tl1`) that owns a device's interactive
SSH loop. See [Drivers & vendors](/drivers/overview/).

**Fault injection** — deliberately making devices misbehave (`auth_fail`, `disconnect_mid`,
`slow_response`, `malformed`) to test tooling resilience. See [Faults](/faults/overview/).

**GNE (Gateway NE)** — in TL1, the network element you connect to directly; it proxies
commands to the [RNEs](#rne-remote-ne) behind it. Emulated by the `ciena-6500-tl1-gne`
[model](#model). See [Ciena GNE / RNE](/drivers/ciena-tl1/#gateway-and-remote-nes-gne--rne).

**Manifest** — the CSV that maps each `ip:port` to its config, credentials, vendor, and
[driver](#driver). The contract between the two binaries. See
[Manifest format](/generating-configs/manifest/).

**mmap / zero-copy** — configs are memory-mapped and streamed straight to the SSH channel
without per-request copies, which is what lets one host serve tens of thousands of sessions.
See [Architecture](/getting-started/concepts/).

**Model** — a fully-qualified, generatable device type in the generator registry. Its name is
the [`--distribution`](/generating-configs/size-buckets/) key and the manifest `size_bucket`
value.

**NCM** — network configuration management; the class of tooling rcfg-sim is built to
load-test. See [Using with rConfig](/examples/using-with-rconfig/).

**rcfg-sim-gen** — the config generator binary.

**rcfg-sim** — the SSH server binary.

**RNE (Remote NE)** — a TL1 network element with no direct management access, reached only
through its [GNE](#gne-gateway-ne) by naming its **TID** in a command
(`RTRV-EQPT:RNE-LIMERICK:3;`). See [Ciena GNE / RNE](/drivers/ciena-tl1/#gateway-and-remote-nes-gne--rne).

**TID (target identifier)** — the TL1 field that names which NE a command is for: empty/`ALL`
addresses the local node; an RNE's TID routes the command to that [RNE](#rne-remote-ne).

**TL1** — Transaction Language 1, the management protocol the [Ciena TL1
driver](/drivers/ciena-tl1/) speaks over SSH (`ACT-USER`, `RTRV-*`, `COMPLD`/`DENY`).
