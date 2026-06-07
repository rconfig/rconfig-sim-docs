---
title: "Writing a new driver"
description: "How to add a new vendor personality to rcfg-sim: implement the Driver interface, register it, add a generator template, and keep metrics and faults uniform."
sidebar:
  label: Writing a new driver
  order: 6
slug: drivers/writing-a-driver
---

Adding a vendor to rcfg-sim is intentionally small: **one runtime file** for the driver and
**one template plus a registry entry** for the generator. Nothing in the hot path needs to
know your vendor exists.

## 1. Implement the Driver

Create `internal/sshsrv/driver_<vendor>.go` and implement the four-method
[`Driver` interface](/drivers/overview/#the-driver-interface). Register it from `init()`:

```go
package sshsrv

func init() { registerDriver(myVendor{}) }

type myVendor struct{}

func (myVendor) Name() string            { return "myvendor_os" }
func (myVendor) RequiresSSHAuth() bool   { return true }
func (myVendor) Commands() []string      { return []string{ /* Cmd* label strings */ } }
func (myVendor) Serve(ctx *sessionCtx)   { /* the interactive loop */ }
```

## 2. Route responses through the shared helpers

In `Serve`, never sleep or write to the channel directly for command responses. Use the
session-context machinery so timing, faults, and metrics stay uniform:

- Call `ctx.applyResponseDelay()` between resolving a command and dispatching it.
- Build a `Response` and pass it to `ctx.emit(cmd, cmdStart, resp)`; check its return value to
  know when to close the session.
- Stream large payloads via `Response.ConfigOutput` (the `mmap` slice) to preserve the
  [zero-copy hot path](/getting-started/concepts/#zero-copy-config-delivery). Use
  `Response.Trailer` for any closing bytes (e.g. a terminator).

This is what gives your driver fault injection (`disconnect_mid`, `malformed`,
`slow_response`) and the command-duration metric for free.

## 3. Add command labels

Add any new `Cmd*` constants and their `String()` cases, and return them from `Commands()`.
The server unions every driver's `Commands()` and pre-registers them, keeping the
`rcfgsim_command_duration_seconds` cardinality [bounded](/metrics/overview/). **Never** use
raw user input as a label value.

## 4. Add a generator model

To produce devices for your driver, add one `registry` entry in
`internal/configs/generator.go` (vendor string, the `template` id matching your driver's
`Name()`, the template file, and a data builder) and a `templates/<name>.tmpl`. The model
name becomes a valid [`--distribution`](/generating-configs/size-buckets/) key.

## 5. Test it

- Add unit tests for command resolution and response shape.
- Add an integration test (build tag `integration`) that connects over real SSH.
- If your output is meant to be byte-stable for a seed, add a determinism test like
  `TestCienaDeterministic`.

Run the gate before opening a PR:

```bash
make vet fmt test
make integration
```

See [Contributing](/contributing/dev-setup/) for the full PR checklist, and the shipped
[Ciena TL1 driver](/drivers/ciena-tl1/) as a complete, self-contained worked example.
