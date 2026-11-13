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
