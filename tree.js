// tree.js：由父子关系建树，并按预算丢弃区间。
export function build(spans, parents, budget) {
  const list = Array.isArray(spans) ? spans : [];
  const parentOf = parents || {};

  const roots = [];
  const depthOf = {};
  for (const span of list) {
    if (parentOf[span.id] === null || parentOf[span.id] === undefined) roots.push(span.id);
  }

  // 深度：根为 1；沿父链向上迭代求解，避免深链递归爆栈。
  let depth = 0;
  for (const span of list) {
    if (depthOf[span.id] !== undefined) continue;
    const chain = [];
    let current = span.id;
    while (current !== null && current !== undefined && depthOf[current] === undefined) {
      chain.push(current);
      current = parentOf[current];
    }
    let level = current === null || current === undefined ? 0 : depthOf[current];
    for (let i = chain.length - 1; i >= 0; i--) {
      level += 1;
      depthOf[chain[i]] = level;
      if (level > depth) depth = level;
    }
  }

  const limit = budget === undefined || budget === null ? list.length : Number(budget);
  const keptSet = new Set();
  const dropped = [];

  if (limit >= list.length) {
    for (const span of list) keptSet.add(span.id);
  } else {
    // 超过预算：深的优先留下（同深度编号小者优先）；浅的被丢弃。
    const order = list.map((span, index) => index);
    order.sort((a, b) => {
      const da = depthOf[list[a].id] || 0;
      const db = depthOf[list[b].id] || 0;
      if (da !== db) return db - da;
      return a - b;
    });

    for (const index of order) {
      const needed = [];
      let current = list[index].id;
      while (current !== null && current !== undefined && !keptSet.has(current)) {
        needed.push(current);
        current = parentOf[current];
      }
      if (keptSet.size + needed.length <= limit) {
        for (const id of needed) keptSet.add(id);
      }
    }

    for (const span of list) {
      if (!keptSet.has(span.id)) dropped.push(span.id);
    }
  }

  const kept = list.map((span) => span.id).filter((id) => keptSet.has(id));

  return { roots, depth, kept, dropped };
}
