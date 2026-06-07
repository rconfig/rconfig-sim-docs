---
title: "Determinism & seeds"
description: "How rcfg-sim generates byte-identical configs from a seed, why determinism matters for reproducible load tests, and how the project verifies it."
sidebar:
  label: Determinism & seeds
  order: 4
slug: generating-configs/determinism
---

rcfg-sim's generator is **fully deterministic**: the same `--seed` produces byte-identical
output every time, on any machine.

## Why it matters

- **Reproducible campaigns.** Regenerate the exact same 50,000-device fleet months later to
  re-run a test or chase a regression.
- **Hashable output.** Because the tree is byte-stable, regression tests can hash the entire
  config set and compare. The project does exactly this (`TestRunDeterministic`, and
  `TestCienaDeterministic` for the Ciena model) — two runs with the same seed must hash equal.
- **Shareable repros.** "Reproduce with `--seed 1337 --distribution xl:100`" fully specifies a
  fleet; no need to ship gigabytes of configs.

## How the seed flows

The `--seed` value (default `42`) seeds the generator's PRNG. Every per-device choice —
hostname, interfaces, ACL contents, routing, serial number — is derived from `(seed, device
index)`. Change the seed and you get a completely different but equally valid fleet; keep it
and you get the same fleet bit-for-bit.

```bash
# These two runs produce identical output trees
./bin/rcfg-sim-gen --count 1000 --seed 7 --output-dir /tmp/a ...
./bin/rcfg-sim-gen --count 1000 --seed 7 --output-dir /tmp/b ...
diff -r /tmp/a /tmp/b    # no differences
```

## Determinism vs runtime randomness

Determinism applies to **generation**. At **runtime**, two things are deliberately *not*
fixed:

- **Response-delay jitter** ([timing](/running-server/timing/)) varies per command.
- **Fault injection** ([faults](/faults/overview/)) is seeded per-session from the session ID
  plus a timestamp, so it is deterministic within a session but random across the fleet.

This separation is intentional: the fleet you serve is reproducible, but its moment-to-moment
behaviour under load is realistically varied.

## A note for contributors

Any change that alters template output for a given seed will fail the deterministic tests by
design. When a change is intentional, the test fixture is updated to match — see
[Contributing](/contributing/dev-setup/).
