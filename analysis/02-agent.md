# 02 — The "agent" in the shipped app (REA findings)

Everything below is **observed** unless marked *inference*.

## Bottom line

The agent in the Android app is **Claude Code, remote-controlled from the
phone** — not a second chatbot. The phone is a dispatch/control surface; tool
execution happens on a paired desktop or in Anthropic cloud environments.

## Evidence

### 1. It is Claude Code

- `res/values/strings.xml`:
  - "Your agentic coding partner that works directly in your codebase. Build
    features, fix bugs, and ask questions."
  - "Auto mode is now Claude Code's default permission mode"
  - "Claude Code on the computer running this session needs to sign in again."
  - "Have Claude Desktop? Turn on Remote Control in Settings → Claude Code."
- Navigation route preserved by R8:
  `com.anthropic.claude.agentchat.navigation.AgentChat` (a Compose route object)
  and `…agentchat.navigation.DispatchSessionHint` (String + Boolean nav args).

### 2. Paired desktop / Remote Control

Strings: "Your phone and desktop are now paired", "Claude works from your
computer", "Dispatch tasks to Claude and check in from your phone or computer -
all in one seamless conversation.", "Remote Control is off on your computer",
"Looking for your desktop.", "Get desktop app link", "Reach your desktop from
your pocket".

Manifest: `CallWindowActivity`, `ArtifactAppActivity`, `NewWindowActivity`.

### 3. Same Messages SSE stream, with tool blocks

`smali_classes4/com/anthropic/claude/conversation/sse/a.smali` enumerates stream
content-block types:

```
text, tool_use, tool_result, thinking, voice_note, bell, flag, unknown, error
```

and carries strings `toolUseId` and "tool approval kept through the drop".
This is the standard Anthropic Messages streaming protocol — the app is just
another consumer of it.

### 4. Permission modes are first-class

`smali/cu/g0.smali` declares the mode values:

```
default, plan, auto, acceptEdits, bypassPermissions
```

`smali_classes5/uv/a0.smali` references `permission_mode` and `agent`.

Strings: "Auto mode lets Claude handle permission prompts automatically. Claude
checks each tool call for risky actions and prompt injection before executing,
runs the ones it assesses as lower-risk, and blocks the rest.", "Enable Auto
mode?", "Failed to approve tool call", "Failed to deny tool call", "Approve &
auto mode", "This model requires Auto mode", "Entered plan mode".

### 5. Tools are MCP namespaces

`smali_classes4/s40/a.smali` holds a set of special tool names:

```
mcp__remote-devices__Claude_Browser__request_access
mcp__remote-browser__browser_form_request
mcp__remote-devices__computer_
mcp__remote-devices__Claude_Browser__
mcp__claude-code-remote__ask_to_message_session
mcp__hearthbot__ask_to_message_project
computer:request
```

So tool calls arrive as MCP-style `mcp__<server>__<tool>` names from servers
hosted by the paired desktop / remote devices — the phone does not implement
these tools itself.

### 6. Subagents, background agents, workflows

Strings: "Subagents", "Custom agents", "subagent", "Background agent stopped",
"Stop agent?", "Stop agent", "Messaged agent", "Running agent: %1$s",
"Agent %1$d", "Agent %1$d's window", "No agents have started yet",
"Dynamic workflows run many subagents in parallel and can use a lot of your
usage limit.", "%1$s: %2$d done, %3$d running, %4$d error of %5$d agents".

### 7. Skills, hooks, plugins, plan mode, code execution

Strings: "Proposed skill", "You already have a skill named /%1$s.",
"A hook requires confirmation for this command/edit/tool",
"A plugin's hook requires confirmation …", "A skill's hook requires
confirmation …", "Entered plan mode", "Cloud environments power Claude's code
execution.", "Code execution and file creation", "MCP tools", "MCP servers
not allowed" / "Allow MCP servers".

### 8. Connectors / environment data

- Plaid initializer in the manifest:
  `…personalfinance.plaidscreens.PlaidWindowsStartup` → banking connector.
- ~50 `android.permission.health.READ_*` permissions → Health Connect.
- Strings mention google drive, gmail, calendar, custom connectors.
- Accepted share types in `DeepLinkActivity`: image, pdf, docx, odt, xlsx, xls,
  pptx, ipynb, json/xml/yaml, js/sh, zip, video, audio.

## What this means for our BYOK clone

**Available to us with just an API key:** the Messages protocol itself —
`text`, `thinking`, and `tool_use` / `tool_result` blocks. Our adapter already
parses `text` and `thinking`; `tool_use`/`tool_result` are the missing piece.

**Not available with BYOK alone** (requires account auth + Anthropic
infrastructure): device pairing / Remote Control, Claude's cloud code-execution
environments, the `mcp__remote-devices__*`, `mcp__claude-code-remote__*`, and
`mcp__hearthbot__*` servers, and account-based connectors.

**Clonable as client-side UX driven by tool blocks:** tool-call cards, approve /
deny prompts, permission-mode selector, plan mode, subagent/background-agent
lists, skill check prompts. Actual tool execution can be wired to *our own*
local MCP servers later — that is a separate design decision.

## Unknowns

- Whether the agent's tool loop runs entirely server-side or partly on the
  paired desktop (static evidence shows the transport and UI, not execution).
- The exact system prompt injected for agent sessions.
- Whether `voice_note`, `bell`, and `flag` blocks are agent-specific.
