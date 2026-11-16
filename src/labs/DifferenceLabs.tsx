import { useState } from 'react';
import { bit, gate, gateDerivative, not } from './core';
import type { Bit, Gate } from './core';
import { BitControl, Circuit, GateControl, MathText, Result, Value } from './shared';

export function DifferenceLab() {
  const [x,setX] = useState<Bit>(1),[a,setA] = useState<Bit>(1),[b,setB] = useState<Bit>(0),[stuck,setStuck] = useState<Bit>(0);
  const y = x ? a : b, faulty = stuck ? a : b, derivative = bit(a !== b), excited = x !== stuck;
  return <div className="lab"><p className="lab-eyebrow">可控小例子 · 2:1 选择器</p><div className="formula"><MathText>{String.raw`y=xa+\overline{x}b,\quad y_x=y|_{x=0}\oplus y|_{x=1}=b\oplus a`}</MathText></div>
    <div className="lab-controls"><BitControl label="选择信号 x" value={x} onChange={setX}/><BitControl label="数据 a" value={a} onChange={setA}/><BitControl label="数据 b" value={b} onChange={setB}/><BitControl label="x 的 stuck-at 值" value={stuck} onChange={setStuck}/></div>
    <div className="cofactor-grid"><div className={`lab-panel ${x===0?'panel-selected':''}`}><span className="muted">固定 x = 0</span><h4>y₀ = b = {b}</h4><p>仅把 x 换成 0，a、b 保持当前值。</p></div><div className={`lab-panel ${x===1?'panel-selected':''}`}><span className="muted">固定 x = 1</span><h4>y₁ = a = {a}</h4><p>仅把 x 换成 1，a、b 保持当前值。</p></div></div>
    <div className="value-row"><Value name="布尔差 yₓ" value={`${b} ⊕ ${a} = ${derivative}`} emphasis={!!derivative}/><Value name="正常 y" value={y}/><Value name="故障 y" value={faulty}/></div>
    <Result detected={y!==faulty}>{y!==faulty ? '检测成功：故障已激励，而且能传到输出。' : excited ? '已激励，但 a = b，输出对 x 不敏感，故障被屏蔽。' : '尚未激励：正常 x 已等于 stuck-at 值，电路没有差异。'}</Result>
    <div className="condition-track"><span className={excited?'pass':''}>① 激励 x ≠ {stuck}：{excited?'满足':'不满足'}</span><span>×</span><span className={derivative?'pass':''}>② 传播 yₓ = 1：{derivative?'满足':'不满足'}</span><span>＝</span><strong>{bit(excited && !!derivative)}</strong></div>
    <p className="callout">布尔差只问“翻转 x 会不会改变 y”。检测 x/{stuck} 还必须让正常 x = {not(stuck)}。可尝试把 a、b 同时设成 1，观察激励与传播为什么是两件事。</p></div>;
}

const formulas: Record<Gate,string> = {
  AND:'y_x=z_xw\\oplus zw_x\\oplus z_xw_x', NAND:'y_x=z_xw\\oplus zw_x\\oplus z_xw_x',
  OR:'y_x=z_x\\overline{w}\\oplus\\overline{z}w_x\\oplus z_xw_x', NOR:'y_x=z_x\\overline{w}\\oplus\\overline{z}w_x\\oplus z_xw_x', XOR:'y_x=z_x\\oplus w_x',
};
export function GateDerivativeLab() {
  const [kind,setKind]=useState<Gate>('AND'),[z,setZ]=useState<Bit>(0),[w,setW]=useState<Bit>(0),[dz,setDz]=useState<Bit>(1),[dw,setDw]=useState<Bit>(1);
  const zz=bit(z!==dz),ww=bit(w!==dw),before=gate(kind,z,w),after=gate(kind,zz,ww),dy=gateDerivative(kind,z,w,dz,dw);
  const caseText = dz===0&&dw===0 ? '两条输入都不变，输出也不变。' : dz===1&&dw===1 ? kind==='XOR' ? '两条输入同时翻转，两次 XOR 变化抵消。' : '两条输入同时翻转：原值相同才改变输出，原值不同则互换。' : `只有 ${dz?'z':'w'} 翻转；另一条输入必须让该门敏感。`;
  return <div className="lab"><p className="lab-eyebrow">用实际翻转验证门级布尔差</p><div className="lab-controls"><GateControl value={kind} onChange={setKind}/><BitControl label="原值 z" value={z} onChange={setZ}/><BitControl label="原值 w" value={w} onChange={setW}/><BitControl label="zₓ：z 是否翻转" value={dz} onChange={setDz}/><BitControl label="wₓ：w 是否翻转" value={dw} onChange={setDw}/></div>
    <div className="cofactor-grid">{([{title:'翻转 x 前',u:z,v:w,y:before},{title:'翻转 x 后',u:zz,v:ww,y:after}]).map(item=><div className="lab-panel" key={item.title}><h4>{item.title}</h4><Circuit title={`${item.title}：(${item.u}, ${item.v}) → ${item.y}`} height={165} width={400} nodes={[{id:'z',label:'z',x:45,y:40,value:item.u},{id:'w',label:'w',x:45,y:125,value:item.v},{id:'gate',label:kind,x:205,y:82},{id:'y',label:'y',x:350,y:82,value:item.y}]} edges={[{from:'z',to:'gate'},{from:'w',to:'gate'},{from:'gate',to:'y'}]}/></div>)}</div>
    <div className="formula"><MathText>{formulas[kind]}</MathText></div><Result detected={!!dy}>yₓ = {before} ⊕ {after} = {dy}。{caseText}</Result>
    <p className="callout">zₓ、wₓ 是“翻转标志”，不是输入值。翻转后的值是 z ⊕ zₓ 与 w ⊕ wₓ。{kind==='NAND'||kind==='NOR'?'输出取反不改变布尔差，所以该门和对应的 AND / OR 门使用同一差分公式。':''}</p></div>;
}

export function ReconvergenceLab() {
  const [kind,setKind]=useState<Gate>('XOR'),[x,setX]=useState<Bit>(1),[a,setA]=useState<Bit>(1),[b,setB]=useState<Bit>(1),[site,setSite]=useState('stem'),[stuck,setStuck]=useState<Bit>(0);
  const xu=site==='stem'||site==='upper'?stuck:x,xv=site==='stem'||site==='lower'?stuck:x;
  const u=bit(x*a),v=bit(x*b),uf=bit(xu*a),vf=bit(xv*b),y=gate(kind,u,v),yf=gate(kind,uf,vf),changed=[u!==uf,v!==vf];
  const both=changed.every(Boolean);
  return <div className="lab"><p className="lab-eyebrow">教学示例 · 同一故障沿两条路径重汇聚</p><div className="lab-controls"><label className="select-control">汇聚门<select value={kind} onChange={e=>setKind(e.target.value as Gate)}>{(['XOR','OR','AND'] as Gate[]).map(g=><option key={g}>{g}</option>)}</select></label><BitControl label="源信号 x" value={x} onChange={setX}/><BitControl label="上支路使能 a" value={a} onChange={setA}/><BitControl label="下支路使能 b" value={b} onChange={setB}/><label className="select-control">故障位置<select value={site} onChange={e=>setSite(e.target.value)}><option value="stem">扇出干线 x</option><option value="upper">仅上支路 xᵤ</option><option value="lower">仅下支路 xᵥ</option></select></label><BitControl label="stuck-at 值" value={stuck} onChange={setStuck}/></div>
    <Circuit title="节点显示 正常 / 故障；干线故障影响两条分支，支路故障只影响一条。" width={660} height={270} nodes={[{id:'x',label:'x 干线',x:55,y:135,value:`${x} / ${site==='stem'?stuck:x}`,fault:site==='stem'},{id:'xu',label:'xᵤ',x:205,y:60,value:`${x} / ${xu}`,fault:site==='upper'},{id:'xv',label:'xᵥ',x:205,y:210,value:`${x} / ${xv}`,fault:site==='lower'},{id:'u',label:`AND a=${a}`,x:365,y:60,value:`${u} / ${uf}`,active:changed[0]},{id:'v',label:`AND b=${b}`,x:365,y:210,value:`${v} / ${vf}`,active:changed[1]},{id:'y',label:`y · ${kind}`,x:585,y:135,value:`${y} / ${yf}`,active:y!==yf}]} edges={[{from:'x',to:'xu'},{from:'x',to:'xv'},{from:'xu',to:'u',active:changed[0]},{from:'xv',to:'v',active:changed[1]},{from:'u',to:'y',active:changed[0]},{from:'v',to:'y',active:changed[1]}]}/>
    <Result detected={y!==yf}>{y!==yf?'输出出现差异，故障可检测。':both?'两条路径都有差异，但在汇聚处抵消，输出没有差异。':changed.some(Boolean)?'只有一条路径携带差异，却被另一输入的控制值屏蔽。':'差异没有到达汇聚门；检查激励与支路使能。'}</Result>
    <div className="value-row"><Value name="上路故障差异 Δu" value={bit(changed[0])}/><Value name="下路故障差异 Δv" value={bit(changed[1])}/><Value name="输出故障差异 Δy" value={bit(y!==yf)} emphasis={y!==yf}/></div>
    <p className="callout">这里的 Δu、Δv 比较正常值与实际注入故障后的值。只有干线故障被激励、确实翻转 x 时，它们才分别等于 uₓ、vₓ；未激励时差异为 0，不能据此判断不敏感。默认干线 x/0、x=a=b=1 时，两路都从 1 变 0。XOR 的 1⊕1 与 0⊕0 都是 0；换成 OR 或 AND，输出从 1 变 0。同一张结构图，门类型会决定是否屏蔽。这里是用于比较机制的示例，不是课件原图。</p></div>;
}
