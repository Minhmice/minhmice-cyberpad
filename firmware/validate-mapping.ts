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
assert.ok(yamlContent.includes("prev"));
assert.ok(yamlContent.includes("play"));
assert.ok(yamlContent.includes("next"));

const jsonContent = JSON.parse(fs.readFileSync("minhmice-cyberpad/firmware/webhid-profile.json", "utf8"));
assert.strictEqual(jsonContent.name, "minhmice-cyberpad");
assert.strictEqual(jsonContent.vendorId, 4489);
assert.strictEqual(jsonContent.productId, 34882);
assert.ok(jsonContent.layers[0].buttons.includes("Ctrl+Alt+Shift+1"));
assert.ok(jsonContent.layers[0].buttons.includes("Ctrl+Alt+Shift+2"));

console.log("Hardware layout YAML & WebHID JSON validation passed.");
