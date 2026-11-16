import { useState } from 'react';
import { assignments, bit, gate } from './core';
import type { Bit } from './core';
import { Circuit, MathText, Result, Value } from './shared';

type Assumption = 'a0'|'f1'|'a1'|'f0';
export function LearningLab() {
  const [assumption,setAssumption]=useState<Assumption>('a0'),[step,setStep]=useState(2);
  const rows=assignments(3).map(([a,b,c])=>({a,b,c,d:bit(a*b),e:bit(a*c),f:bit(a*b || a*c)}));
  const valid=rows.filter(r=>r[assumption[0] as 'a'|'f']===Number(assumption[1]));
  const names=['a','b','c','d','e','f'] as const;
  const forced=Object.fromEntries(names.map(n=>[n,valid.every(r=>r[n]===valid[0][n])?String(valid[0][n]):'X']));
  const values=step===2?forced:step===1&&assumption==='a0'?{a:'0',b:'X',c:'X',d:'0',e:'0',f:'X'}:step===1&&assumption==='f0'?{a:'X',b:'X',c:'X',d:'0',e:'0',f:'0'}:Object.fromEntries(names.map(n=>[n,n===assumption[0]?assumption[1]:'X']));
  const labels:Record<Assumption,string>={a0:'已知 a = 0，向前推出什么？',f1:'已知 f = 1，使用逆否推理',a1:'尝试反向：a = 1 能否推出 f = 1？',f0:'尝试反向：f = 0 能否推出 a = 0？'};
  return <div className="lab"><p className="lab-eyebrow">1110 原学习电路 · d = ab，e = ac，f = d + e</p><div className="lab-controls"><label className="select-control">假设<select value={assumption} onChange={e=>{setAssumption(e.target.value as Assumption);setStep(0);}}>{Object.entries(labels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label></div>
    <div className="lab-step-buttons" role="group" aria-label="推理步骤">{['① 输入假设','② 局部传播','③ 完整推论'].map((label,i)=><button key={label} className={step===i?'active':''} onClick={()=>setStep(i)}>{label}</button>)}</div>
    <Circuit title="X 表示在当前约束下仍有多种可能；高亮为已经确定的信号。" width={620} height={280} nodes={[{id:'a',label:'a',x:55,y:140},{id:'b',label:'b',x:55,y:45},{id:'c',label:'c',x:55,y:235},{id:'d',label:'d · AND',x:300,y:75},{id:'e',label:'e · AND',x:300,y:205},{id:'f',label:'f · OR',x:550,y:140}].map(n=>({...n,value:values[n.id],active:values[n.id]!=='X'}))} edges={[{from:'a',to:'d'},{from:'b',to:'d'},{from:'a',to:'e'},{from:'c',to:'e'},{from:'d',to:'f'},{from:'e',to:'f'}]}/>
    <div className="lab-panel" aria-live="polite"><h4>{step===0?'先固定一个信号':step===1?'只看相邻逻辑门':'保留所有符合假设的输入，再找共同结论'}</h4>
      {step===0?<p>当前只赋值 {assumption[0]} = {assumption[1]}，其他信号还没有决定。</p>:step===1?<p>{assumption==='a0'?'a = 0 是两个 AND 的控制值，所以 d = 0、e = 0；再向前一步就能使 f = 0。':assumption==='f1'?'OR 输出为 1 只说明 d、e 至少一个为 1，局部规则无法选定哪一条。先前学到的全局关系可直接确定 a = 1。':assumption==='f0'?'OR 输出为 0 必须有 d=e=0。但是各个 AND 输出为 0 并不能确定哪个输入为 0，所以此时 a 仍未知。':'仅凭 a=1，不足以确定两个 AND 的输出。继续看所有可行输入，避免把“可能”误当“必然”。'}</p>:<p>{assumption==='a0'?'a = 0 ⇒ d = e = 0 ⇒ f = 0；这个关系与 b、c 无关。':assumption==='f1'?'由 a = 0 ⇒ f = 0 的逆否命题可得 f = 1 ⇒ a = 1。仍需 b、c 至少一个为 1。':assumption==='a1'?'不能推出 f = 1。反例 a=1,b=0,c=0 给出 f=0。a=1 只是 f=1 的必要条件。':'不能推出 a = 0。反例 a=1,b=0,c=0 也有 f=0。逆命题不是逆否命题。'}</p>}
    </div>
    {step===2&&<Result detected={assumption==='a0'||assumption==='f1'}>可行输入共 {valid.length} 个；确定值：{names.filter(n=>forced[n]!=='X').map(n=>n+'='+forced[n]).join('，')}。</Result>}
    <div className="formula"><MathText>{'(a=0)\\Rightarrow(f=0)\\quad\\Longleftrightarrow\\quad(f=1)\\Rightarrow(a=1)'}</MathText></div>
    <p className="callout">在 a=0 导出的 d=e=0 处，f 对两条输入都敏感：f_d=¬e=1，f_e=¬d=1，满足课件中的学习判据 f_d·f_e=1。全局学习记录跨越重汇聚结构的关系；不是把所有箭头随意倒过来。</p>
    <details><summary>用 8 行真值表检查“必然”与“可能”</summary><div className="table-wrap"><table className="lab-table"><caption>高亮行满足当前假设</caption><thead><tr>{names.map(n=><th key={n}>{n}</th>)}<th>满足假设</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i} className={valid.includes(r)?'selected-row':''}>{names.map(n=><td key={n}>{r[n]}</td>)}<td>{valid.includes(r)?'✓':'—'}</td></tr>)}</tbody></table></div></details>
  </div>;
}

export function ControllabilityLab() {
  const [pa,setPa]=useState(0.5),[pb,setPb]=useState(0.5),[selected,setSelected]=useState<[Bit,Bit]>([0,0]);
  const pg=(1-pa)*(1-pb),estimate0=pg*pb;
  const rows=assignments(2).map(([a,b])=>({a,b,g:gate('NOR',a,b),k:gate('NAND',gate('NOR',a,b),b),p:(a?pa:1-pa)*(b?pb:1-pb)}));
  const exact1=rows.reduce((sum,r)=>sum+r.k*r.p,0);
  const current=rows.find(r=>r.a===selected[0]&&r.b===selected[1])!;
  const percent=(n:number)=>(n*100).toFixed(2)+'%';
  return <div className="lab"><p className="lab-eyebrow">补充示例 · 区分结构启发式与精确概率</p><div className="formula"><MathText>{'g=\\overline{a+b},\\qquad k=\\overline{gb}'}</MathText></div>
    <div className="lab-controls probability-controls"><label>P(a=1) = {pa.toFixed(2)}<input type="range" min="0" max="1" step="0.05" value={pa} onChange={e=>setPa(Number(e.target.value))}/></label><label>P(b=1) = {pb.toFixed(2)}<input type="range" min="0" max="1" step="0.05" value={pb} onChange={e=>setPb(Number(e.target.value))}/></label><button onClick={()=>{setPa(0.5);setPb(0.5);}}>恢复等概率输入</button></div>
    <Circuit title="a、b 可独立，但 g 与 b 不独立：b=1 必然使 g=0。" width={590} height={230} nodes={[{id:'a',label:'a',x:55,y:45,value:current.a},{id:'b',label:'b',x:55,y:185,value:current.b},{id:'g',label:'g · NOR',x:280,y:65,value:current.g},{id:'k',label:'k · NAND',x:520,y:120,value:current.k}]} edges={[{from:'a',to:'g'},{from:'b',to:'g'},{from:'b',to:'k'},{from:'g',to:'k'}]}/>
    <div className="cofactor-grid"><div className="lab-panel"><h4>按门逐级计算的独立性近似</h4><p>C₁(g) = (1−P(a))(1−P(b)) = {pg.toFixed(4)}</p><p>C₀(k) ≈ C₁(g)P(b) = {estimate0.toFixed(4)}</p><div className="probability-bar"><span style={{width:percent(1-estimate0)}}/></div><Value name="估算 C₁(k)" value={percent(1-estimate0)}/></div><div className="lab-panel"><h4>枚举真实的联合输入</h4><p>g·b = ¬(a+b)·b = 0</p><p>k 恒等于 1，P(k=0) = 0</p><div className="probability-bar exact"><span style={{width:'100%'}}/></div><Value name="精确 P(k=1)" value={percent(exact1)}/></div></div>
    <Result detected={Math.abs(estimate0)>1e-10}>{estimate0>1e-10?'近似分配了概率给不可能发生的 g=1、b=1 组合。':'在当前边界参数下近似值碰巧与精确值一致；这并不建立 g 与 b 的一般独立性。'}</Result>
    <div className="table-wrap"><table className="lab-table"><caption>点击输入行查看信号；概率来自相互独立的原始输入 a、b</caption><thead><tr><th>a b</th><th>g</th><th>k</th><th>该行概率</th></tr></thead><tbody>{rows.map(r=><tr key={r.a+','+r.b} className={r===current?'selected-row':''}><th><button onClick={()=>setSelected([r.a,r.b])}>{r.a} {r.b}</button></th><td>{r.g}</td><td>{r.k}</td><td>{percent(r.p)}</td></tr>)}</tbody></table></div>
    <p className="callout">课件中的可控性概率常用来排序可选赋值，帮助更快找到证明。独立性近似是搜索启发式；出现重汇聚时不能把它当成精确可达性证明。默认参数得到 C₀(k)≈0.125、C₁(k)≈0.875，而真实 k 始终是 1。</p>
  </div>;
}
