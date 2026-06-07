---
title: "Quickstart recipes"
description: "Copy-paste rcfg-sim recipes: a single device, a small mixed-vendor fleet, a high-throughput benchmark setup, and a Ciena-only optical fleet."
sidebar:
  label: Quickstart recipes
  order: 1
slug: examples/recipes
---

Short, self-contained recipes. Each builds on the [Quickstart](/getting-started/quickstart/);
adjust paths and counts to taste.

## A single device

The smallest possible setup — one Cisco device on one port:

```bash
./bin/rcfg-sim-gen --count 1 --output-dir /tmp/one/configs \
  --manifest /tmp/one/manifest.csv --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 1 --seed 1

./bin/rcfg-sim --listen-ip 127.0.0.1 --port-start 12000 --port-count 1 \
  --manifest /tmp/one/manifest.csv --host-key /tmp/one/hostkey \
  --metrics-addr 127.0.0.1:9100
```

## A small mixed-vendor fleet

Cisco plus Ciena, so you can exercise [multi-vendor handling](/drivers/overview/) and the
[`--ssh-auth=driver`](/running-server/ssh-auth/) mode:

```bash
./bin/rcfg-sim-gen --count 200 --output-dir /tmp/mix/configs \
  --manifest /tmp/mix/manifest.csv --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 200 --seed 42 \
  --distribution "sm:40,md:30,lg:20,ciena-6500-tl1:10"

./bin/rcfg-sim --listen-ip 127.0.0.1 --port-start 12000 --port-count 200 \
  --manifest /tmp/mix/manifest.csv --host-key /tmp/mix/hostkey \
  --ssh-auth driver --metrics-addr 127.0.0.1:9100
```

## A high-throughput benchmark

Zero response delay and a high concurrency cap to measure your *tool's* ceiling rather than
device latency:

```bash
./bin/rcfg-sim --listen-ip 127.0.0.1 --port-start 12000 --port-count 1000 \
  --manifest /tmp/bench/manifest.csv --host-key /tmp/bench/hostkey \
  --response-delay-ms-min 0 --response-delay-ms-max 0 \
  --max-concurrent-sessions 20000 --metrics-addr 127.0.0.1:9100
```

## A large-config fleet

Skew the distribution to big configs to stress diff engines, parsers, and storage:

```bash
./bin/rcfg-sim-gen --count 500 --output-dir /tmp/big/configs \
  --manifest /tmp/big/manifest.csv --ip-base 127.0.0.1 --ip-count 1 \
  --port-start 12000 --devices-per-ip 500 --seed 7 \
  --distribution "xl:40,2xl:30,3xl:20,4xl:10"
```

Mind the [disk requirements](/installation/prerequisites/) — this distribution is large.

## Next

- [Load-test scenarios](/examples/scenarios/) — progressive recipes from 100 to 50k devices
- [Feature verification](/examples/feature-tests/) — confirm specific behaviours
