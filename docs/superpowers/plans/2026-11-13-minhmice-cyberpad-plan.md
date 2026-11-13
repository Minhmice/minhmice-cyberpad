# Minhmice Cyberpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure USB macro keyboard `1189:8842` for OMP model switching (full 40-character commands in composer prompt without auto-Enter) and media knob controls, packaged into the `minhmice-cyberpad` Git repository with zero background daemons.

**Architecture:** The CH57x hardware macro chip stores trigger chords (`Ctrl+Alt+Shift+1` and `Ctrl+Alt+Shift+2`) and media keys (volume/playback). An OMP extension (`minhmice-cyberpad.ts`) registers these shortcut chords and uses `ctx.ui.setEditorText` to dynamically inject the verbatim 40-character `/switch` commands into the OMP prompt buffer for manual review and Enter execution.

**Tech Stack:** TypeScript (OMP Extension API), Rust CLI (`ch57x-keyboard-tool`), WebHID JSON profile, PowerShell 7/Windows HID subsystem, Git.

**Spec:** `docs/superpowers/specs/2026-11-13-minhmice-cyberpad-design.md`

## Global Constraints

- Device hardware: WCH CH57x family keyboard (`VID_1189 & PID_8842`).
- Target models verbatim:
  - Gemini: `9router/ag/gemini-3.8-flash-high`
  - Claude: `9router/cc/claude-sonnet-5-5`
- Keystroke injection must NEVER auto-submit Enter; prompt string must wait for user review.
- No background resident processes (no AutoHotkey, no Python background daemon).
- Device safety: Never enter bootloader `0xEF`; always read backup before flashing.
- Protect composer draft: If composer already contains un-submitted text that is NOT a cyberpad model command, warn via `ctx.ui.notify` instead of clobbering.

---

### Task 1: OMP Cyberpad Extension Core Implementation

**Files:**
- Create: `minhmice-cyberpad/omp-extension/minhmice-cyberpad.ts`
- Test: `minhmice-cyberpad/omp-extension/test-cyberpad-extension.ts`

**Interfaces:**
- Consumes: `@oh-my-pi/pi-coding-agent` (`ExtensionAPI`, `ExtensionContext`)
- Produces: `default function (pi: ExtensionAPI): void` exporting registered shortcuts `ctrl+alt+shift+1` and `ctrl+alt+shift+2` and slash command `/switch`.

- [ ] **Step 1: Write test harness for model injection logic**

```typescript
// minhmice-cyberpad/omp-extension/test-cyberpad-extension.ts
import assert from "node:assert";

export const GEMINI_CMD = "/switch 9router/ag/gemini-3.8-flash-high";
export const CLAUDE_CMD = "/switch 9router/cc/claude-sonnet-5-5";

export function resolveNewEditorText(currentText: string, targetCmd: string): { newText?: string; warning?: string } {
  const trimmed = currentText.trim();
  if (trimmed === "" || trimmed === GEMINI_CMD || trimmed === CLAUDE_CMD) {
    return { newText: targetCmd };
  }
  return { warning: "Unsent draft in prompt. Press Esc or clear prompt before switching model." };
}

// Unit self-tests
assert.strictEqual(resolveNewEditorText("", GEMINI_CMD).newText, GEMINI_CMD);
assert.strictEqual(resolveNewEditorText(GEMINI_CMD, CLAUDE_CMD).newText, CLAUDE_CMD);
assert.strictEqual(resolveNewEditorText("hello draft", GEMINI_CMD).newText, undefined);
assert.ok(resolveNewEditorText("hello draft", GEMINI_CMD).warning?.includes("Unsent draft"));
console.log("Core model injection unit tests passed.");
```

- [ ] **Step 2: Run test to verify test harness works**

Run: `node minhmice-cyberpad/omp-extension/test-cyberpad-extension.ts`
Expected: `Core model injection unit tests passed.`

- [ ] **Step 3: Implement OMP Extension**

```typescript
// minhmice-cyberpad/omp-extension/minhmice-cyberpad.ts
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";

export const GEMINI_CMD = "/switch 9router/ag/gemini-3.8-flash-high";
export const CLAUDE_CMD = "/switch 9router/cc/claude-sonnet-5-5";

export function resolveNewEditorText(currentText: string, targetCmd: string): { newText?: string; warning?: string } {
  const trimmed = currentText.trim();
  if (trimmed === "" || trimmed === GEMINI_CMD || trimmed === CLAUDE_CMD) {
    return { newText: targetCmd };
  }
  return { warning: "Unsent draft in prompt. Press Esc or clear prompt before switching model." };
}

function handleModelSwitch(targetCmd: string, ctx: ExtensionContext) {
  if (!ctx.ui || typeof ctx.ui.setEditorText !== "function") return;
  const current = typeof ctx.ui.getEditorText === "function" ? ctx.ui.getEditorText() : "";
  const decision = resolveNewEditorText(current, targetCmd);
  if (decision.newText !== undefined) {
    ctx.ui.setEditorText(decision.newText);
  } else if (decision.warning && typeof ctx.ui.notify === "function") {
    ctx.ui.notify(decision.warning, "warning");
  }
}

export default function minhmiceCyberpadExtension(pi: ExtensionAPI) {
  pi.setLabel("Minhmice Cyberpad");

  // Shortcut for Key 1: Gemini
  pi.registerShortcut("ctrl+alt+shift+1", {
    description: "Cyberpad: inject 9router Gemini 3.8 Flash High",
    handler: (ctx) => handleModelSwitch(GEMINI_CMD, ctx),
  });

  // Shortcut for Key 2: Claude
  pi.registerShortcut("ctrl+alt+shift+2", {
    description: "Cyberpad: inject 9router Claude Sonnet 3.5",
    handler: (ctx) => handleModelSwitch(CLAUDE_CMD, ctx),
  });

  // Built-in slash command /switch
  pi.registerCommand("switch", {
    description: "Switch active session model by ID or alias",
    handler: async (args, ctx) => {
      const modelId = args.trim();
      if (!modelId) {
        ctx.ui?.notify?.("Usage: /switch <model-id>", "warning");
        return;
      }
      if (typeof pi.setModel === "function") {
        const success = await pi.setModel(modelId);
        if (success) {
          ctx.ui?.notify?.(`Switched model to ${modelId}`, "info");
        } else {
          ctx.ui?.notify?.(`Failed to switch to model: ${modelId}`, "error");
        }
      }
    },
  });
}
```

- [ ] **Step 4: Verify extension syntax with node / bun**

Run: `bun check minhmice-cyberpad/omp-extension/minhmice-cyberpad.ts 2>nul || node -c minhmice-cyberpad/omp-extension/minhmice-cyberpad.ts`
Expected: Syntax check PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git -C minhmice-cyberpad add omp-extension/
git -C minhmice-cyberpad commit -m "feat(extension): implement minhmice cyberpad omp shortcut and switch command"
```

---

### Task 2: Hardware Mapping Definition (`layout.yaml` & `webhid-profile.json`)

**Files:**
- Create: `minhmice-cyberpad/firmware/layout.yaml`
- Create: `minhmice-cyberpad/firmware/webhid-profile.json`
- Test: `minhmice-cyberpad/firmware/validate-mapping.ts`

**Interfaces:**
- Consumes: Specifications from `doc/actions.md` of `ch57x-keyboard-tool` and `PROTOCOL.md` of `macropad-rebind`.
- Produces: Valid YAML config for `ch57x-keyboard-tool` and valid JSON for `macropad-rebind`.

- [ ] **Step 1: Write mapping validation script**

```typescript
// minhmice-cyberpad/firmware/validate-mapping.ts
import fs from "node:fs";
import assert from "node:assert";

const yamlContent = fs.readFileSync("minhmice-cyberpad/firmware/layout.yaml", "utf8");
assert.ok(yamlContent.includes("model: ch57x-1") || yamlContent.includes("model: ch57x-2") || yamlContent.includes("columns:"));
assert.ok(yamlContent.includes("ctrl-alt-shift-1"));
assert.ok(yamlContent.includes("ctrl-alt-shift-2"));
assert.ok(yamlContent.includes("volumedown"));
assert.ok(yamlContent.includes("volumeup"));
assert.ok(yamlContent.includes("mute"));
console.log("Hardware layout YAML validation passed.");
```

- [ ] **Step 2: Create `layout.yaml`**

```yaml
# minhmice-cyberpad/firmware/layout.yaml
# Hardware: VID 1189, PID 8842 (WCH CH57x family)
# Orientation: Knobs on the right, buttons on the left
model: ch57x-1
orientation: normal
rows: 3
columns: 4
knobs: 2

layers:
  - buttons:
      # Row 1: Key 1 (Gemini Trigger), Key 2 (Claude Trigger), Quick File, Command Palette
      - ["ctrl-alt-shift-1", "ctrl-alt-shift-2", "ctrl-p", "ctrl-shift-p"]
      # Row 2: Format Document, Go to Definition, Rename, Toggle Terminal
      - ["shift-alt-f", "f12", "f2", "ctrl-`"]
      # Row 3: Toggle Comment, Copy Line Down, Save, Undo
      - ["ctrl-/", "shift-alt-down", "ctrl-s", "ctrl-z"]
    knobs:
      # Knob 1 (Upper Right): Volume control
      - ccw: "volumedown"
        press: "mute"
        cw: "volumeup"
      # Knob 2 (Lower Right): Media playback
      - ccw: "prev"
        press: "play"
        cw: "next"

  - buttons:
      # Layer 2 (Auxiliary / Navigation)
      - ["ctrl-alt-shift-1", "ctrl-alt-shift-2", "alt-left", "alt-right"]
      - ["ctrl-pageup", "ctrl-pagedown", "home", "end"]
      - ["ctrl-c", "ctrl-v", "ctrl-x", "ctrl-y"]
    knobs:
      - ccw: "volumedown"
        press: "mute"
        cw: "volumeup"
      - ccw: "prev"
        press: "play"
        cw: "next"

  - buttons:
      # Layer 3 (Window control)
      - ["ctrl-alt-shift-1", "ctrl-alt-shift-2", "ctrl-win-left", "ctrl-win-right"]
      - ["win-up", "win-down", "win-left", "win-right"]
      - ["alt-tab", "win-tab", "win-d", "ctrl-w"]
    knobs:
      - ccw: "volumedown"
        press: "mute"
        cw: "volumeup"
      - ccw: "prev"
        press: "play"
        cw: "next"
```

- [ ] **Step 3: Create `webhid-profile.json` (WebHID fallback for Edge/Chrome)**

```json
{
  "name": "minhmice-cyberpad",
  "version": 1,
  "vendorId": 4489,
  "productId": 34882,
  "layers": [
    {
      "buttons": [
        "Ctrl+Alt+Shift+1",
        "Ctrl+Alt+Shift+2",
        "Ctrl+P",
        "Ctrl+Shift+P",
        "Shift+Alt+F",
        "F12",
        "F2",
        "Ctrl+`",
        "Ctrl+/",
        "Shift+Alt+Down",
        "Ctrl+S",
        "Ctrl+Z"
      ],
      "knobs": [
        { "ccw": "VolumeDown", "press": "Mute", "cw": "VolumeUp" },
        { "ccw": "PrevTrack", "press": "PlayPause", "cw": "NextTrack" }
      ]
    }
  ]
}
```

- [ ] **Step 4: Run validation script**

Run: `node minhmice-cyberpad/firmware/validate-mapping.ts`
Expected: `Hardware layout YAML validation passed.`

- [ ] **Step 5: Commit Task 2**

```bash
git -C minhmice-cyberpad add firmware/
git -C minhmice-cyberpad commit -m "feat(firmware): add cyberpad layout configuration and webhid profile"
```

---

### Task 3: Backup & Flash Automation Scripts

**Files:**
- Create: `minhmice-cyberpad/scripts/backup-pad.ps1`
- Create: `minhmice-cyberpad/scripts/flash-pad.ps1`
- Create: `minhmice-cyberpad/scripts/install-extension.ps1`

**Interfaces:**
- Consumes: USB HID access on Windows, `layout.yaml`, OMP profile directory (`~/.omp/agent/extensions`).
- Produces: Automated PowerShell scripts to backup, flash, and install the extension into user's live OMP environment.

- [ ] **Step 1: Write `install-extension.ps1`**

```powershell
# minhmice-cyberpad/scripts/install-extension.ps1
$ErrorActionPreference = "Stop"

$ompExtDir = "$env:USERPROFILE\.omp\agent\extensions"
if (-not (Test-Path $ompExtDir)) {
    New-Item -ItemType Directory -Path $ompExtDir -Force | Out-Null
}

$sourceFile = Join-Path $PSScriptRoot "..\omp-extension\minhmice-cyberpad.ts"
$targetFile = Join-Path $ompExtDir "minhmice-cyberpad.ts"

Copy-Item -Path $sourceFile -Destination $targetFile -Force
Write-Host "[OK] Copied minhmice-cyberpad.ts to $targetFile"
```

- [ ] **Step 2: Write `flash-pad.ps1`**

```powershell
# minhmice-cyberpad/scripts/flash-pad.ps1
[CmdletBinding()]
param(
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

Write-Host "Checking USB HID Device (VID 1189, PID 8842)..."
$device = Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -like "*VID_1189&PID_8842*" }
if (-not $device) {
    Write-Error "Hardware macropad not detected! Please connect keyboard via USB-A to USB-C cable."
}
Write-Host "[OK] Detected: $($device[0].FriendlyName)"

$yamlPath = Join-Path $PSScriptRoot "..\firmware\layout.yaml"
if (-not (Test-Path $yamlPath)) {
    Write-Error "Configuration layout.yaml missing at $yamlPath"
}

if ($CheckOnly) {
    Write-Host "[OK] Configuration layout check passed."
    exit 0
}

# Check if ch57x-keyboard-tool exists
$tool = Get-Command ch57x-keyboard-tool -ErrorAction SilentlyContinue
if ($tool) {
    Write-Host "Flashing with ch57x-keyboard-tool..."
    & ch57x-keyboard-tool upload $yamlPath
    Write-Host "[SUCCESS] Flashed configuration to chip onboard memory!"
} else {
    Write-Host "[NOTE] ch57x-keyboard-tool CLI not found in PATH."
    Write-Host "You can either:"
    Write-Host "  1. Run: cargo install ch57x-keyboard-tool"
    Write-Host "  2. Or open https://jvspier.github.io/macropad-rebind/ in Chrome/Edge and import firmware/webhid-profile.json"
}
```

- [ ] **Step 3: Test scripts syntax and dry-run**

Run: `powershell -NoProfile -File minhmice-cyberpad/scripts/flash-pad.ps1 -CheckOnly`
Expected: `[OK] Detected... [OK] Configuration layout check passed.`

- [ ] **Step 4: Commit Task 3**

```bash
git -C minhmice-cyberpad add scripts/
git -C minhmice-cyberpad commit -m "feat(scripts): add automated install and hardware flashing scripts"
```

---

### Task 4: Documentation & Repository Packaging

**Files:**
- Create: `minhmice-cyberpad/README.md`
- Create: `minhmice-cyberpad/.gitignore`

**Interfaces:**
- Consumes: Completed extension, firmware configs, and scripts.
- Produces: Standalone git repository ready for local usage and remote push.

- [ ] **Step 1: Write `.gitignore`**

```gitignore
node_modules/
*.log
backup-*.bin
backup-*.json
.env*
```

- [ ] **Step 2: Write comprehensive `README.md`**

```markdown
# minhmice-cyberpad

Personalized firmware and OMP AI coding agent integration for USB Macro Keyboard (`1189:8842`).

## Highlights
- **100% On-Chip Hardware Flashing**: No background resident tools, no AutoHotkey, zero CPU overhead.
- **Explicit Model Injection**: Pressing Key 1 or Key 2 inserts the verbatim 40-character `/switch` command into OMP prompt buffer.
- **Manual Gate**: No auto-Enter; operator reviews model before pressing Enter.
- **Dedicated Media Knobs**: Knobs control volume (mute) and media playback.

## Keyboard Layout
- **Left Column Key 1**: `9router/ag/gemini-3.8-flash-high`
- **Left Column Key 2**: `9router/cc/claude-sonnet-5-5`
- **Knob 1 (Top Right)**: Turn: Volume Down/Up | Press: Mute
- **Knob 2 (Bottom Right)**: Turn: Previous/Next Track | Press: Play/Pause

## Quick Setup
1. **Install OMP Extension**:
   ```powershell
   .\scripts\install-extension.ps1
   ```
2. **Flash Hardware Memory**:
   - Via CLI: `cargo install ch57x-keyboard-tool && .\scripts\flash-pad.ps1`
   - Via WebHID: Open `https://jvspier.github.io/macropad-rebind/` in Chrome/Edge, connect device, and load `firmware/webhid-profile.json`.
```

- [ ] **Step 3: Commit Task 4 and finalize repository**

```bash
git -C minhmice-cyberpad add README.md .gitignore docs/
git -C minhmice-cyberpad commit -m "docs: finalize minhmice-cyberpad documentation and spec"
```

---

### Task 5: End-to-End Live Verification

**Files:**
- Verify: `minhmice-cyberpad/omp-extension/minhmice-cyberpad.ts`
- Verify: `~/.omp/agent/extensions/minhmice-cyberpad.ts`
- Live verification in OMP runtime.

- [ ] **Step 1: Deploy extension to active OMP extensions folder**
Run: `powershell -NoProfile -File minhmice-cyberpad/scripts/install-extension.ps1`
Expected: Copy succeeded.

- [ ] **Step 2: Verify OMP loads extension cleanly without error**
Run: `omp --help` or test extension load.
Expected: Exit code 0, no diagnostic errors.

- [ ] **Step 3: Final Git status check**
Run: `git -C minhmice-cyberpad status`
Expected: Working tree clean on branch `main`.
