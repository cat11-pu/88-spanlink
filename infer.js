// infer.js：父子推断（按起点排序一次扫描，线段树取最短包含者，不做两两比较）

// 编号的自然序：数字段按数值、其余按字典序（s2 < s10）。
export function compareId(a, b) {
  const ta = String(a).match(/\d+|\D+/g) || [];
  const tb = String(b).match(/\d+|\D+/g) || [];
  const n = Math.min(ta.length, tb.length);
  for (let i = 0; i < n; i += 1) {
    const xa = ta[i];
    const xb = tb[i];
    if (xa === xb) continue;
    const na = /^\d+$/.test(xa);
    const nb = /^\d+$/.test(xb);
    if (na && nb) {
      const d = Number(xa) - Number(xb);
      if (d !== 0) return d < 0 ? -1 : 1;
      return xa.length - xb.length;
    }
    return xa < xb ? -1 : 1;
  }
  return ta.length - tb.length;
}

export function infer(spans) {
  const parents = {};
  const orphans = [];
  const list = [];
  const seen = new Set();
  for (const span of spans) {
    if (!(span.start < span.end)) {
      const error = new Error("E_BAD_SPAN: " + span.id + " 起点必须小于终点");
      error.code = "E_BAD_SPAN";
      throw error;
    }
    if (seen.has(span.id)) {
      orphans.push(span.id); // 编号冲突，无法唯一挂进森林，单列为孤儿
      continue;
    }
    seen.add(span.id);
    parents[span.id] = null; // 先按输入顺序占位，保证返回键序稳定
    list.push({ id: span.id, start: span.start, end: span.end, index: list.length });
  }
  const n = list.length;
  if (n === 0) return { parents: parents, orphans: orphans, depth: 0 };

  // 末端坐标压缩，线段树叶子 = 某个末端值当前最优（最短）的候选包含者
  const ends = Array.from(new Set(list.map((s) => s.end))).sort((a, b) => a - b);
  const posOf = new Map(ends.map((v, i) => [v, i]));
  const m = ends.length;
  let size = 1;
  while (size < m) size <<= 1;
  const seg = new Array(size * 2).fill(-1);

  function better(i, j) {
    if (i < 0) return j;
    if (j < 0) return i;
    const a = list[i];
    const b = list[j];
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (la !== lb) return la < lb ? i : j; // 最短优先
    if (a.start !== b.start) return a.start < b.start ? i : j; // 同长度取起点较早
    return compareId(a.id, b.id) <= 0 ? i : j; // 再取编号小
  }
  function add(pos, idx) {
    let p = pos + size;
    seg[p] = better(seg[p], idx);
    for (p >>= 1; p >= 1; p >>= 1) seg[p] = better(seg[p << 1], seg[(p << 1) | 1]);
  }
  function query(l, r) {
    let res = -1;
    for (l += size, r += size; l < r; l >>= 1, r >>= 1) {
      if (l & 1) { res = better(res, seg[l]); l += 1; }
      if (r & 1) { r -= 1; res = better(res, seg[r]); }
    }
    return res;
  }

  // 按起点升序扫描；同起点让末端大的先入树，保证包含者先于被包含者可见；
  // 完全相同的区间按编号小先入树。先查后插，父节点永远在扫描序之前，天然无环。
  const sweep = list.slice().sort((a, b) =>
    a.start - b.start || b.end - a.end || compareId(a.id, b.id));
  const depths = new Array(n).fill(1);
  let depth = 0;
  for (const span of sweep) {
    const best = query(posOf.get(span.end), m); // 候选末端 >= 自身末端，即完全包含
    if (best >= 0) {
      parents[span.id] = list[best].id;
      depths[span.index] = depths[best] + 1;
    }
    if (depths[span.index] > depth) depth = depths[span.index];
    add(posOf.get(span.end), span.index);
  }
  return { parents: parents, orphans: orphans, depth: depth };
}
