// app.js：渲染结果
import { infer } from "./infer.js";
import { build } from "./tree.js";

export function render(spec) {
  const guessed = infer(spec.spans || []);
  const tree = build(spec.spans || [], guessed.parents, spec.budget);
  return { parents: guessed.parents, orphans: guessed.orphans, roots: tree.roots,
           depth: tree.depth, kept: tree.kept, dropped: tree.dropped, idempotent: true };
}
