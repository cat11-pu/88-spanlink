// tree.js：树与预算（基线：不裁剪、不记孤儿）
export function build(spans, parents, budget) {
  return { roots: spans.map((span) => span.id), depth: 1, kept: spans.map((span) => span.id), dropped: [] };
}
