---
title: "Development setup"
description: "How to set up a development environment for rcfg-sim and run the pre-merge gate: go fmt, go vet, unit tests, integration tests, and benchmarks."
sidebar:
  label: Development setup
  order: 1
slug: contributing/dev-setup
---

rcfg-sim is open source (MIT) and contributions are welcome. This page covers the local
workflow; read [Scope & versioning](/contributing/scope/) before proposing changes that touch
user-facing surfaces.

## Prerequisites

- **Go 1.24+** (CI tests 1.24 and 1.25)
- `make`, `git`

```bash
git clone https://github.com/rconfig/rconfig-sim.git
cd rconfig-sim
make build
```

## The pre-merge gate

Every PR must pass the same gate CI runs. Run it locally before pushing:

```bash
make fmt     # gofmt -s, no diff after running
make vet     # go vet, with and without the integration tag
make test    # unit tests, incl. determinism and metrics cardinality
make build   # both binaries compile
```

And for changes that touch the SSH path, the integration suite:

```bash
make integration   # real SSH listeners on loopback (build tag: integration)
```

## Tests you should know about

- **Determinism tests** (`TestRunDeterministic`, `TestCienaDeterministic`) hash the generated
  output across two same-seed runs. Any change to template output for a given seed fails them
  *by design*; update the fixture only when the diff is intentional. See
  [Determinism](/generating-configs/determinism/).
- **Cardinality test** asserts the Prometheus label sets stay bounded. Adding a label or value
  without updating it will fail. See [Metrics overview](/metrics/overview/).
- **Characterization tests** pin Cisco output (greeting, enable-mode flow, session close) so
  refactors stay byte-identical. Run `make integration` before and after a refactor.

## Benchmarks

```bash
make bench
```

The hot path (command dispatch) benchmarks around 640 ns/op. Preserve the zero-copy path — no
per-command allocations on `show running-config`. See
[Architecture](/getting-started/concepts/#zero-copy-config-delivery).

## Dependencies

The project intentionally depends on only three external libraries
(`golang.org/x/crypto`, `golang.org/x/sys`, `prometheus/client_golang`). New dependencies need
discussion first — see [Scope](/contributing/scope/).
