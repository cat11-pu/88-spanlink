// infer.js：按时间包含关系推断父子。
// 父节点 = 完全包含该区间且最短的区间；同长度取起点较早，再取编号小。
// 起点升序一次扫描 + 终点坐标压缩 + Fenwick 后缀最小值，O(n log n)，不做两两比较。
export function infer(spans) {
  const list = Array.isArray(spans) ? spans : [];

  for (const span of list) {
    if (!span || !(span.start < span.end)) {
      const error = new Error("bad span: start must be strictly less than end");
      error.code = "E_BAD_SPAN";
      throw error;
    }
  }

  const n = list.length;
  const parents = {};
  for (const span of list) parents[span.id] = null;

  if (n === 0) return { parents, orphans: [], depth: 0 };

  // 扫描顺序：起点升序；同起点终点降序（长的先入表，才能包住同起点较短者）；再按编号。
  const order = list.map((span, index) => index);
  order.sort((a, b) => {
    const sa = list[a];
    const sb = list[b];
    if (sa.start !== sb.start) return sa.start < sb.start ? -1 : 1;
    if (sa.end !== sb.end) return sb.end - sa.end;
    return a - b;
  });

  // 终点坐标压缩，终点越大 Fenwick 下标越小，后缀包含查询变前缀最小值。
  const ends = list.map((span) => span.end).sort((a, b) => a - b);
  const rankOf = new Map();
  let rankCount = 0;
  for (const end of ends) {
    if (!rankOf.has(end)) rankOf.set(end, rankCount++);
  }
  const fenwick = new Array(rankCount + 1).fill(null);

  // 返回 true 表示 list[i] 比 list[j] 更适合作父（更短；同长起点更早；再编号小）。
  const better = (i, j) => {
    if (j === null) return true;
    const span = list[i];
    const other = list[j];
    const lenA = span.end - span.start;
    const lenB = other.end - other.start;
    if (lenA !== lenB) return lenA < lenB;
    if (span.start !== other.start) return span.start < other.start;
    return i < j;
  };

  for (const index of order) {
    const span = list[index];
    let pos = rankCount - rankOf.get(span.end); // 1..rankCount
    let candidate = null;
    for (let i = pos; i > 0; i -= i & -i) {
      const stored = fenwick[i];
      if (stored !== null && (candidate === null || better(stored, candidate))) candidate = stored;
    }
    if (candidate !== null) parents[span.id] = list[candidate].id;

    for (let i = pos; i <= rankCount; i += i & -i) {
      const stored = fenwick[i];
      if (stored === null || better(index, stored)) fenwick[i] = index;
    }
  }

  // 防御性检查：指向不存在区间的父指针按孤儿处理（纯推断输入不会产生）。
  const orphans = [];
  for (const span of list) {
    const parent = parents[span.id];
    if (parent !== null && !Object.prototype.hasOwnProperty.call(parents, parent)) orphans.push(span.id);
  }

  const depthMap = {};
  let depth = 0;
  for (const span of list) {
    if (depthMap[span.id] !== undefined) continue;
    const chain = [];
    let current = span.id;
    while (current !== null && depthMap[current] === undefined) {
      chain.push(current);
      current = parents[current];
    }
    let level = current === null ? 0 : depthMap[current];
    for (let i = chain.length - 1; i >= 0; i--) {
      level += 1;
      depthMap[chain[i]] = level;
      if (level > depth) depth = level;
    }
  }

  return { parents, orphans, depth };
}
