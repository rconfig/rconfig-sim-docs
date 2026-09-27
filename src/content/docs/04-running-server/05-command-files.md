---
title: "Command files"
description: "The rcfg-sim --commands-root flag: answer any CLI command per device from a file you provide, with the folder layout, slug rule, caching and metrics explained."
sidebar:
  label: Command files
  order: 5
slug: running-server/command-files
---

`--commands-root DIR` lets a simulated device answer **any** CLI command with the contents of a
file you provide. Use it for output the generator does not produce, such as LLDP/CDP neighbour
tables, interface listings, or a vendor-specific `show version`, for example to demo or test
topology discovery across vendors.

The flag is off by default. With it unset, every driver behaves exactly as before, byte for
byte.

```bash
./bin/rcfg-sim \
  --manifest manifest.csv \
  --listen-ip 127.0.0.1 --port-start 12700 --port-count 3 \
  --commands-root /path/to/commands
```

## Folder layout

There is one folder per device, named exactly after the manifest `hostname`, and one file per
command:

```text
commands/
  core-01/
    show_lldp_neighbors_detail.txt
    show_interfaces.txt
    show_version.txt
  dist-01/
    show_lldp_neighbors.txt
    show_interfaces.txt
```

## Slug rule

The file name is `<slug>.txt`. The slug is the typed command:

1. trimmed, with runs of whitespace collapsed to one space
2. lowercased
3. with a trailing `| no-more` removed
4. with spaces replaced by `_`

| Typed | File |
|---|---|
| `show lldp neighbors detail` | `show_lldp_neighbors_detail.txt` |
| `  Show   LLDP  Neighbors  ` | `show_lldp_neighbors.txt` |
| `show cdp neighbors detail \| no-more` | `show_cdp_neighbors_detail.txt` |
| `show configuration \| display set` | `show_configuration_\|_display_set.txt` |

Because the slug is always lowercase, file names must be lowercase too. A command containing
`/` or `\` (RouterOS-style `/interface print`, say) is never looked up, so a client cannot
reach outside the device's folder.

## How a command is answered

- The file is checked **before** the driver's built-in commands, so a file can override one,
  for example to give an Arista device a real EOS `show version`.
- A hit sends the file with CRLF line endings, whatever the file uses, ending in CRLF, and then
  the usual prompt. It is subject to the normal response delay and
  [`slow_response`](/faults/fault-types/) fault.
- A miss falls through to the built-in behaviour unchanged, including the driver's usual
  "invalid input" error.
- A missing root, or a device with no folder, simply means no files for that device. It is
  not an error.

Command files apply to the [`cisco_ios`](/drivers/cisco-ios/) and [`junos`](/drivers/junos/)
drivers. TL1 drivers do not look up files.

## Caching

A device's folder is **listed once**, on that device's first command, and each file is **read
on its first hit**. Both are kept for the life of the process.

:::caution[Restart after changing files]
Files added, removed or edited after a device has been used are not seen until the instance
restarts. The same goes for a device folder created after startup.
:::

Nothing a client types can grow the cache, which is bounded by the files on disk. A miss costs a
map lookup, never a disk read.

## Metrics

Every file-served command is recorded under one label value,
`rcfgsim_command_duration_seconds{command="file"}`, however many commands are file-backed. The
series is pre-registered only when `--commands-root` is set. See the
[metrics reference](/metrics/reference/).

## Example

The repo ships the [mesh-campus scenario](/examples/mesh-campus/), a three-vendor campus
built entirely on command files.
