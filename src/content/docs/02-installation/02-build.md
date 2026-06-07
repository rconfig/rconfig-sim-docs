---
title: "Building rcfg-sim from source"
description: "Clone the repository and build the rcfg-sim and rcfg-sim-gen binaries with make, plus the available Makefile targets for testing and benchmarking."
sidebar:
  label: Build from source
  order: 2
slug: installation/build
---

rcfg-sim is built with `make`. There are no code-generation steps and no external build
tools beyond the Go toolchain.

## Clone and build

```bash
git clone https://github.com/rconfig/rconfig-sim.git
cd rconfig-sim
make build
```

`make build` compiles both binaries into `bin/` as static executables
(`CGO_ENABLED=0`):

- `bin/rcfg-sim` — the SSH server
- `bin/rcfg-sim-gen` — the config generator

You can run them straight from `bin/`, or install them system-wide with
[`make install`](/installation/system-install/).

## Makefile targets

| Target | What it does |
|---|---|
| `make build` | Compile both binaries into `bin/` |
| `make test` | Run unit tests (fast, no network) |
| `make integration` | Run integration tests (real SSH over loopback; build tag `integration`) |
| `make bench` | Run hot-path benchmarks |
| `make vet` | `go vet`, with and without the integration tag |
| `make fmt` | `gofmt -s` |
| `make install` | Install binaries, systemd unit, sysctl and limits drop-ins |
| `make uninstall` | Stop/disable units and remove installed files |
| `make generate-configs` | Wrapper around `rcfg-sim-gen` with env-var overrides |
| `make deploy-aliases` / `make remove-aliases` | Manage IP aliases via `deploy/ip-aliases.sh` |
| `make clean` | Remove build artifacts |

## Verifying the build

```bash
./bin/rcfg-sim --help
./bin/rcfg-sim-gen --help
```

Both print their full flag set with defaults — see the [CLI reference](/reference/cli/).

## Running the test suite

```bash
make test          # unit tests
make integration   # spins up real SSH listeners on loopback
```

The unit suite includes the deterministic-output tests that hash the generated config tree;
see [Determinism & seeds](/generating-configs/determinism/) and
[Contributing](/contributing/dev-setup/).
