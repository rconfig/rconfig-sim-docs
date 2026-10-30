---
title: "Fault injection examples"
description: "Practical rConfig-sim fault injection recipes for testing authentication retries, partial transfers, timeouts, and parser robustness in network tooling."
sidebar:
  label: Examples
  order: 3
slug: faults/examples
---

Recipes for common resilience tests. All assume a small loopback fleet from the
[Quickstart](/getting-started/quickstart/).

## Flaky authentication

Model a fleet where ~5% of logins fail. Good for verifying retry/backoff and that genuinely
reachable devices aren't marked dead after one bad attempt.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --fault-rate 0.05 --fault-types "auth_fail"
```

## Mid-transfer drops

Test partial-read handling and integrity checks: configs are cut off after 20–40% with a TCP
reset.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --fault-rate 0.1 --fault-types "disconnect_mid"
```

## Slow fleet / timeout pressure

Combine a wide base delay with the slow-response multiplier to push timeout and concurrency
behaviour.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --response-delay-ms-min 100 --response-delay-ms-max 1000 \
  --fault-rate 0.05 --fault-types "slow_response"
```

## Garbage configs

Verify your parser and validation survive corrupted output.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --fault-rate 0.1 --fault-types "malformed"
```

## Full chaos

Everything on, at a high rate — a stress test for end-to-end resilience.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --fault-rate 0.2 --fault-types "auth_fail,disconnect_mid,slow_response,malformed"
```

## The same devices hang on every run

Random faults can't tell you *which* devices failed. To assert on specific devices, use
[device profiles](/faults/device-profiles/): here 3% of the fleet hangs for an hour, and the
same seed picks the same hostnames on every run.

```bash
./bin/rcfg-sim \
  --listen-ip 127.0.0.1 --port-start 12000 --port-count 100 \
  --manifest /tmp/rcfg-test/manifest.csv --host-key /tmp/rcfg-test/hostkey \
  --device-profiles "hang:3600s@3%" --profile-seed 42
```

The startup log names the chosen devices in a `device profile active` line.

## Confirming faults fired

After a run, check the counters:

```bash
curl -s http://127.0.0.1:9100/metrics | grep rcfgsim_faults_injected_total
```

The per-type counts should track your configured rate. See the
[metrics reference](/metrics/reference/) and the broader
[load-test scenarios](/examples/scenarios/).
