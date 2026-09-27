---
title: "Cisco IOS driver"
description: "The rcfg-sim cisco_ios driver: supported show commands, enable mode, Cisco-style prefix matching, and the greeting and session flow it presents over SSH."
sidebar:
  label: Cisco IOS driver
  order: 2
slug: drivers/cisco-ios
---

The `cisco_ios` driver presents a Cisco IOS personality over SSH: a greeting, a `host>` /
`host#` prompt, enable mode, and a set of `show` commands answered convincingly. It is the
default driver and the one most NCM tooling will exercise.

## Session flow

On connect the device emits a greeting and the user-mode prompt:

```text
<hostname> line 0 is now available

<hostname>>
```

A typical collection session: set the terminal length, enter enable mode, then pull config.

```text
terminal length 0
enable
Password: enable123
show running-config
exit          ← leaves enable mode
exit          ← closes the session
```

`enable` prompts for the [enable password](/running-server/overview/#credentials); a correct
password moves the prompt from `>` to `#`. A wrong one prints `% Access denied`.

## Supported commands

| Command | Behaviour |
|---|---|
| `terminal length 0` | Silent acknowledgement (disables paging) |
| `terminal pager 0` | Silent acknowledgement |
| `enable` | Prompts for the enable password; enters enable mode |
| `show version` | Canned IOS 15.x version block with the device's hostname and serial |
| `show running-config` | The full generated config, streamed zero-copy from `mmap` |
| `show startup-config` | The same bytes as `show running-config` |
| `show inventory` | Canned inventory; chassis SN matches `show version`'s serial |
| `exit` / `quit` / `logout` / `end` | Leave enable mode, or close the session |

Anything else returns `% Invalid input detected at '^' marker.`, unless a
[command file](/running-server/command-files/) matches it. Command files are checked first,
so they can also override the commands above.

## Prefix matching

Like real IOS, commands resolve by **per-token unique prefix**: `sh ver` → `show version`,
`sh run` → `show running-config`. Two rules make this predictable:

- **Exact matches always win.** `end` resolves as an exit alias even though it shares its
  first two letters with `enable`.
- **Genuinely ambiguous prefixes are rejected.** `en` is a prefix of both `enable` and `end`,
  so it returns `% Ambiguous command` rather than guessing. Type the distinguishing
  character (`ena…` or `end`).

Aliases that collapse to the same action (`exit`/`quit`/`logout`/`end` all close or drop a
mode) are not treated as ambiguous.

## Metrics

Each resolved command is recorded under `rcfgsim_command_duration_seconds{command="..."}`.
The Cisco driver's label values are the `Cmd*` names: `CmdShowRunningConfig`, `CmdEnable`,
`CmdShowVersion`, `CmdUnknown`, `CmdAmbiguous`, and the rest. See the
[metrics reference](/metrics/reference/).

## Arista EOS on `cisco_ios`

rcfg-sim has no separate EOS driver. EOS's CLI is IOS-shaped: `host>` becomes `host#` after
`enable`, and `terminal length 0` turns paging off, so an EOS device runs on `cisco_ios`
(manifest `template` = `cisco_ios`, `vendor` = `Arista`). EOS-specific output, such as
`show lldp neighbors detail` in EOS format or an EOS `show version`, comes from
[command files](/running-server/command-files/). The
[mesh-campus scenario](/examples/mesh-campus/) has a worked EOS device, `core-01`.

In a configuration manager, an IOS SSH template with enable mode works for these devices.

## SSH authentication

`cisco_ios` returns `RequiresSSHAuth() == true` — it authenticates at the SSH transport
layer. Under [`--ssh-auth=driver`](/running-server/ssh-auth/) that means Cisco devices
challenge for a password while Ciena devices don't.
