// tree.js：树与预算（深度从深到浅优先保留，超预算的浅层区间丢弃）
import { compareId } from "./infer.js";

// 每个编号的层深（根为 1），迭代计算避免深链爆栈，带环保护。
function computeDepths(ids, parents) {
  const depth = new Map();
  for (const id of ids) {
    if (depth.has(id)) continue;
    const chain = [];
    const seen = new Set();
    let cur = id;
    while (cur != null && !depth.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      chain.push(cur);
      cur = parents[cur];
    }
    let d = cur != null && depth.has(cur) ? depth.get(cur) : 0;
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      d += 1;
      depth.set(chain[i], d);
    }
  }
  return depth;
}

export function build(spans, parents, budget) {
  const ids = [];
  const seen = new Set();
  for (const span of spans) {
    if (!seen.has(span.id)) {
      seen.add(span.id);
      ids.push(span.id);
    }
  }
  const depthOf = computeDepths(ids, parents);
  const roots = ids.filter((id) => parents[id] == null);
  let depth = 0;
  for (const id of ids) {
    const d = depthOf.get(id);
    if (d > depth) depth = d;
  }

  const limit = typeof budget === "number" && Number.isFinite(budget)
    ? Math.max(0, Math.floor(budget))
    : ids.length;
  let kept;
  let dropped;
  if (ids.length <= limit) {
    kept = ids.slice();
    dropped = [];
  } else {
    // 深度从深到浅、同深度按编号小优先保留，其余丢弃；保留与丢弃互不重叠。
    const ranked = ids.slice().sort((a, b) =>
      depthOf.get(b) - depthOf.get(a) || compareId(a, b));
    const keepSet = new Set(ranked.slice(0, limit));
    kept = ids.filter((id) => keepSet.has(id));
    dropped = ids.filter((id) => !keepSet.has(id));
  }
  return { roots: roots, depth: depth, kept: kept, dropped: dropped };
}
