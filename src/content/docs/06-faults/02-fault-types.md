---
title: "Fault types reference"
description: "The four rcfg-sim fault types — auth_fail, disconnect_mid, slow_response, and malformed — and exactly what each one does to a session."
sidebar:
  label: Fault types
  order: 2
slug: faults/fault-types
---

rcfg-sim supports four fault types, enabled by name via
[`--fault-types`](/faults/overview/). Each fires per relevant event at the configured
`--fault-rate`.

## `auth_fail`

Rejects the SSH authentication as if the password were wrong — indistinguishable from a real
auth failure. Use it to test retry logic, credential-rotation handling, and how your tool
reports unreachable devices.

## `disconnect_mid`

Streams a partial config and then **hard-resets the TCP connection** mid-transfer. The cut
happens after **20–40%** of the config bytes have been written (a uniform random point in that
window). The command's duration is still recorded before the connection is dropped, so your
metrics reflect the work done. This is the fault for testing partial-read handling, resume
logic, and integrity checks on collected configs.

## `slow_response`

Multiplies the per-command [response delay](/running-server/timing/) by a random
**10–50×**, capped at **60 seconds**. A 10 ms floor is applied first so the multiplier is
observable even when `--response-delay-ms-max` is `0`. Use it to exercise timeouts, slow-loris
tolerance, and concurrency back-pressure when a slice of the fleet drags.

## `malformed`

Corrupts the streamed config output. The bytes before and after the corruption keep the
zero-copy path, so this is realistic and cheap. Use it to test parser robustness, validation,
and how your tool handles configs that don't round-trip cleanly.

## Combining faults

Enable several at once; each rolls independently per event:

```bash
--fault-rate 0.1 --fault-types "auth_fail,disconnect_mid,slow_response,malformed"
```

At `--fault-rate 0.1`, roughly one in ten relevant events triggers each enabled fault. Tune
the rate to model anything from a mostly-healthy fleet to a chaos test.

## Metrics

Each activation increments `rcfgsim_faults_injected_total{type="auth_fail|disconnect_mid|slow_response|malformed"}`.
The label set is closed to exactly these four values. See the
[metrics reference](/metrics/reference/).
