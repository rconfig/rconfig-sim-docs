---
title: "Security policy"
description: "How to report security vulnerabilities in rcfg-sim, what is in and out of scope, and why the default credentials are test values rather than secrets."
sidebar:
  label: Security
  order: 4
slug: contributing/security
---

rcfg-sim is a **test instrument** that runs in test environments. Even so, security reports
are taken seriously.

## Reporting a vulnerability

Report privately to **security@rconfig.com** — not via public GitHub issues. The project aims
to acknowledge quickly, share a remediation plan, and coordinate disclosure.

## In scope

- SSH authentication and session handling
- Command dispatch
- Resource exhaustion (beyond the documented `--max-concurrent-sessions` cap)
- Metrics exposure
- The generator and deployment artifacts

## Out of scope

- The **intentional** [fault-injection](/faults/overview/) behaviour — misbehaving on demand
  is the whole point
- Bugs in rConfig or any other tool *under test*
- The default test credentials (below)
- Operator misconfiguration

## About the default credentials

The defaults — username `admin`, password `admin`, enable `enable123` — are **test values, not
secrets**. They exist so a fresh checkout works without setup. An empty `--password` even
accepts any password by design, because tooling under test always sends *something*.

Don't expose an rcfg-sim instance to an untrusted network expecting it to be a security
boundary; it isn't one. Run it in a controlled test environment. See
[network setup](/installation/network-setup/) for loopback vs routable trade-offs.

## License

rcfg-sim is released under the **MIT License** (© OS Informatics Limited). See the
[repository](https://github.com/rconfig/rconfig-sim) for the full text.
