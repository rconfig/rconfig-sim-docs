---
title: "Juniper Junos driver"
description: "The rcfg-sim junos driver: a minimal Juniper Junos operational-mode CLI with user@host prompt, silent screen-length, show configuration, and Junos-style errors."
sidebar:
  label: Juniper Junos driver
  order: 2
slug: drivers/junos
---

The `junos` driver presents a minimal **Juniper Junos** operational-mode CLI over SSH. It covers
what a configuration manager needs to log in, turn paging off and pull the config. Anything
else comes from [command files](/running-server/command-files/).

## Selecting it

Put `junos` in the device's manifest `template` column. The generator does not produce `junos`
rows, so edit the manifest by hand:

```csv
hostname,ip,port,vendor,template,username,password,enable_password,config_file,size_bucket
dist-01,127.0.0.1,12701,Juniper,junos,admin,,,/path/to/dist-01.cfg,sm
```

The `config_file` is served verbatim by `show configuration`, so point it at Junos-style
config text.

## Session flow

There is no greeting and no enable mode. The prompt is `<user>@<hostname>> `, with a trailing
space, using the name the client logged in with:

```text
admin@dist-01> set cli screen-length 0
admin@dist-01> show configuration | display set
## Last commit: 2026-09-24 08:12:00 UTC
system {
    host-name dist-01;
}
...
admin@dist-01> show bogus
                     ^
unknown command.
admin@dist-01> exit
```

## Supported commands

| Command | Behaviour |
|---|---|
| `set cli screen-length <n>` | Silent (no output, new prompt) |
| `set cli screen-width <n>` | Silent |
| `show configuration` | The device's config file, streamed zero-copy like Cisco `show running-config` |
| `show configuration \| display set` | The same bytes (the file is not converted to set format) |
| … `\| no-more` | Accepted after either form |
| `exit` / `quit` | Close the session |
| anything else | A [command file](/running-server/command-files/) if one matches, otherwise a caret under the first character typed and `unknown command.` |

Commands are case-insensitive, and extra whitespace is ignored.

## Metrics

Label values: `CmdJunosSetCli`, `CmdJunosShowConfiguration`, plus the shared `CmdUnknown`,
`CmdEmpty` and `CmdExit`. File-served commands use `file`. See the
[metrics reference](/metrics/reference/).

## SSH authentication

`junos` returns `RequiresSSHAuth() == true`: it authenticates at the SSH transport, like
`cisco_ios`.

## Arista EOS

There is no EOS driver. EOS's CLI is IOS-shaped (`host>`, `enable`, `host#`,
`terminal length 0`), so EOS devices run on [`cisco_ios`](/drivers/cisco-ios/#arista-eos-on-cisco_ios)
with EOS output supplied through command files.
