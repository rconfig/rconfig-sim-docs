---
title: "SSH authentication modes"
description: "The rcfg-sim --ssh-auth flag: password, driver, and none modes for mixed-vendor fleets where some devices authenticate at the SSH transport and others in-band."
sidebar:
  label: SSH auth modes
  order: 2
slug: running-server/ssh-auth
---

Different vendors authenticate differently. Cisco IOS challenges for a password at the SSH
transport layer; Ciena TL1 accepts the SSH connection and authenticates **in-band** via an
`ACT-USER` command. The `--ssh-auth` flag tells the server how to handle this across a
mixed fleet.

## The three modes

```bash
--ssh-auth password   # default
```

| Mode | Behaviour |
|---|---|
| `password` *(default)* | Every device requires SSH password auth at the transport, regardless of driver. |
| `driver` | Each driver decides. Cisco IOS requires SSH auth; Ciena TL1 does not (it authenticates in-band). |
| `none` | No SSH transport auth for any device — connections are accepted, and authentication (if any) happens in-band. |

## When to use each

- **`password`** — the simplest and most common. Use it for all-Cisco fleets or whenever you
  want a uniform SSH password gate.
- **`driver`** — the realistic choice for **mixed-vendor** fleets. A Cisco device behaves like
  Cisco (SSH password) and a Ciena device behaves like Ciena (open SSH, `ACT-USER` login),
  matching how your tooling must treat them in production.
- **`none`** — useful for testing tooling that does its own in-band auth, or to isolate
  transport-layer behaviour from authentication.

The decision is driven by each driver's `RequiresSSHAuth()` — see
[Drivers & vendors](/drivers/overview/).

## Password semantics

When SSH password auth is in effect:

- A configured `--password` must match.
- An **empty** `--password` accepts any password (handy for tooling that always sends
  *something*).
- `--username` is currently informational; SSH auth is password-only.

For Ciena TL1 in-band login, the same accept-any-when-empty semantics apply to the
`ACT-USER` credentials — see the [Ciena TL1 driver](/drivers/ciena-tl1/).

## Auth metrics

Every transport-level attempt is counted in `rcfgsim_auth_attempts_total{result="ok|fail"}`,
and handshake latency is tracked in `rcfgsim_handshake_duration_seconds`. See
[Metrics](/metrics/reference/).
