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
    handler: (ctx: ExtensionContext) => handleModelSwitch(GEMINI_CMD, ctx),
  });

  // Shortcut for Key 2: Claude
  pi.registerShortcut("ctrl+alt+shift+2", {
    description: "Cyberpad: inject 9router Claude Sonnet 3.5",
    handler: (ctx: ExtensionContext) => handleModelSwitch(CLAUDE_CMD, ctx),
  });

  // Built-in slash command /switch
  pi.registerCommand("switch", {
    description: "Switch active session model by ID or alias",
    handler: async (args: string, ctx: ExtensionContext) => {
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
