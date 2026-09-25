import assert from "node:assert";
import { infer } from "../infer.js";
import { build } from "../tree.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const spans = [{ id: "s0", start: 0, end: 10 }, { id: "s1", start: 1, end: 5 }];

check("infer returns parents", () => {
  assert.strictEqual(typeof infer(spans).parents, "object");
});

check("infer reports orphans", () => {
  assert.ok(Array.isArray(infer(spans).orphans));
});

check("build returns roots", () => {
  assert.ok(Array.isArray(build(spans, {}, 4).roots));
});

check("build reports dropped", () => {
  assert.ok(Array.isArray(build(spans, {}, 4).dropped));
});

check("render exposes idempotent flag", () => {
  assert.strictEqual(typeof render({ spans: spans, budget: 4 }).idempotent, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
