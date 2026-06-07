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
(`sm`, `md`, `lg`, `xl`, `2xl`–`6xl`, `ciena-6500-tl1`). Selected via
[`--distribution`](/generating-configs/size-buckets/).

**Determinism** — the property that a given [`--seed`](/generating-configs/determinism/)
produces byte-identical generator output across runs.

**Driver** — a vendor personality (`cisco_ios`, `ciena_tl1`) that owns a device's interactive
SSH loop. See [Drivers & vendors](/drivers/overview/).

**Fault injection** — deliberately making devices misbehave (`auth_fail`, `disconnect_mid`,
`slow_response`, `malformed`) to test tooling resilience. See [Faults](/faults/overview/).

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

**TL1** — Transaction Language 1, the management protocol the [Ciena TL1
driver](/drivers/ciena-tl1/) speaks over SSH (`ACT-USER`, `RTRV-*`, `COMPLD`/`DENY`).
