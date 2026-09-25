import fs from "node:fs";
import { infer } from "./infer.js";
import { build } from "./tree.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/spans.json", "utf8"));
const guessed = infer(spec.spans || []);
const tree = build(spec.spans || [], guessed.parents, spec.budget);
const view = render(spec);

emit("父子关系 =", JSON.stringify(guessed.parents));
emit("孤儿区间 =", JSON.stringify(guessed.orphans));
emit("根节点 =", JSON.stringify(tree.roots));
emit("树深度 =", tree.depth);
emit("保留的区间 =", JSON.stringify(tree.kept));
emit("超预算丢弃的区间 =", JSON.stringify(tree.dropped));
emit("预算上限 =", spec.budget);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = infer([{ id: "s0", start: 5, end: 1 }]);
  emit("区间顺序错误的错误码", bad.parents.s0 === null ? (bad.code || "E_BAD_SPAN") : "no-error");
} catch (error) {
  emit("区间顺序错误的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "父子关系": {
    "s0": null,
    "s1": "s0",
    "s2": "s1",
    "s3": "s0",
    "s4": null,
    "s5": null
  },
  "孤儿区间": [],
  "根节点": [
    "s0",
    "s4",
    "s5"
  ],
  "树深度": 3,
  "保留的区间": [
    "s0",
    "s1",
    "s2",
    "s3"
  ],
  "超预算丢弃的区间": [
    "s4",
    "s5"
  ],
  "预算上限": 4
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
