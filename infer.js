// infer.js：父子推断（基线：全部当根节点）
export function infer(spans) {
  const parents = {};
  for (const span of spans) parents[span.id] = null;
  return { parents: parents, orphans: [], depth: 1 };
}
