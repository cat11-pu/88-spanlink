// app.js：渲染结果
import { infer } from "./infer.js";
import { build } from "./tree.js";

export function render(spec) {
  const spans = spec.spans || [];
  const guessed = infer(spans);
  const again = infer(spans); // 重复推断校验幂等：同一输入必须给出同一关系
  const tree = build(spans, guessed.parents, spec.budget);
  return { parents: guessed.parents, orphans: guessed.orphans, roots: tree.roots,
           depth: tree.depth, kept: tree.kept, dropped: tree.dropped,
           idempotent: JSON.stringify(guessed.parents) === JSON.stringify(again.parents) };
}
