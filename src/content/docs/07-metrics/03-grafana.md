---
title: "Grafana query recipes"
description: "Ready-to-use PromQL queries for monitoring rcfg-sim under load — session throughput, error rate, command latency percentiles, and throughput in bits per second."
sidebar:
  label: Grafana queries
  order: 3
slug: metrics/grafana
---

PromQL expressions for the dashboards you'll want when driving rcfg-sim hard. Point
Prometheus at each instance's [`/metrics`](/metrics/overview/) endpoint first.

## Session throughput

Successful sessions per second:

```promql
sum(rate(rcfgsim_sessions_total{result="ok"}[1m]))
```

## Error rate

Percentage of sessions ending in any non-`ok` result over 5 minutes:

```promql
sum(rate(rcfgsim_sessions_total{result!="ok"}[5m]))
  / sum(rate(rcfgsim_sessions_total[5m])) * 100
```

## Command latency (p95)

95th-percentile per-command latency, broken out by command:

```promql
histogram_quantile(0.95,
  sum by (command, le) (rate(rcfgsim_command_duration_seconds_bucket[5m])))
```

## Throughput in bits per second

```promql
sum(rate(rcfgsim_bytes_sent_total[1m])) * 8
```

## Concurrency vs the cap

Active sessions — compare against your `--max-concurrent-sessions`:

```promql
sum(rcfgsim_active_sessions)
```

## Auth failure rate

```promql
sum(rate(rcfgsim_auth_attempts_total{result="fail"}[5m]))
  / sum(rate(rcfgsim_auth_attempts_total[5m])) * 100
```

## Faults firing by type

Confirm injected faults track your configured rate:

```promql
sum by (type) (rate(rcfgsim_faults_injected_total[5m]))
```

## Handshake latency (p99)

```promql
histogram_quantile(0.99,
  sum by (le) (rate(rcfgsim_handshake_duration_seconds_bucket[5m])))
```

See the [metrics reference](/metrics/reference/) for the full metric and label inventory.
