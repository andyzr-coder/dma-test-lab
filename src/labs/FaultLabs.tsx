import { useState } from 'react';
import { assignments, dGate, dValues, nandTree, not, treeNodes, treeSensitivities } from './core';
import type { Bit, DValue, Gate, TreeNode } from './core';
import { BitControl, Circuit, GateControl, MathText, nandEdges, nandNodes, Result, Value } from './shared';

export function FaultTreeLab() {
  const [inputs,setInputs]=useState<Bit[]>([1,1,0,0]),[node,setNode]=useState<TreeNode>('x1'),[stuck,setStuck]=useState<Bit>(0),[level,setLevel]=useState(2);
  const good=nandTree(inputs),bad=nandTree(inputs,{node,stuck}),sensitivity=treeSensitivities(inputs);
  const active=treeNodes.filter(n=>sensitivity[n] && (level===2 || (level===1 && !n.startsWith('x')) || n==='y'));
  const update=(i:number,v:Bit)=>setInputs(inputs.map((old,j)=>i===j?v:old));
  const detected=treeNodes.filter(n=>sensitivity[n]).map(n=>n+'/'+not(good[n]));
  return <div className="lab"><p className="lab-eyebrow">1110 原电路 · 无扇出 NAND 树</p>
    <div className="lab-controls">{inputs.map((v,i)=><BitControl key={i} label={'x'+(i+1)} value={v} onChange={value=>update(i,value)}/>)}<label className="select-control">故障节点<select value={node} onChange={e=>setNode(e.target.value as TreeNode)}>{treeNodes.map(n=><option key={n}>{n}</option>)}</select></label><BitControl label="stuck-at 值" value={stuck} onChange={setStuck}/></div>
    <div className="lab-step-buttons" role="group" aria-label="反向敏感性传播层级">{['① 从输出 y 开始','② 推到 z₁、z₂','③ 推到全部输入'].map((label,i)=><button key={i} className={level===i?'active':''} aria-pressed={level===i} onClick={()=>setLevel(i)}>{label}</button>)}</div>
    <Circuit title="点击节点选择故障；高亮表示该节点对输出敏感。每个值为 正常 / 故障。" width={540} height={295} nodes={nandNodes(Object.fromEntries(treeNodes.map(n=>[n,good[n]+' / '+bad[n]])),active,node)} edges={nandEdges.map(e=>({...e,active:active.includes(e.from as TreeNode)}))} onNodeClick={id=>setNode(id as TreeNode)}/>
    <div className="formula"><MathText>{'y_y=1,\\quad y_{z_1}=z_2,\\quad y_{x_1}=x_2z_2'}</MathText></div>
    <Result detected={good.y!==bad.y}>{node}/{stuck}：{good[node]===stuck?'未激励。':!sensitivity[node]?'已激励，但不敏感。':'激励与传播均满足，已检测。'} 输出 {good.y} / {bad.y}。</Result>
    <div className="lab-panel"><h4>当前向量能检测的全部故障</h4><div className="fault-chips">{detected.map(f=><button key={f} className={f===node+'/'+stuck?'active':''} onClick={()=>{const [n,v]=f.split('/');setNode(n as TreeNode);setStuck(Number(v) as Bit);}}>{f}</button>)}</div><p>每个敏感节点只检测与其正常值相反的 stuck-at 故障。y 自身始终敏感。</p></div>
    <details><summary>展开全部 16 个输入，核对 {node}/{stuck}</summary><div className="table-wrap"><table className="lab-table"><caption>二进制编号按 x₄x₃x₂x₁；点击某行应用向量</caption><thead><tr><th>向量</th><th>x₄x₃x₂x₁</th><th>正常 y</th><th>故障 y</th><th>检测</th></tr></thead><tbody>{assignments(4).map((a,n)=>{const g=nandTree(a),f=nandTree(a,{node,stuck});return <tr key={n} className={a.join('')===inputs.join('')?'selected-row':''}><th><button onClick={()=>setInputs(a)}>t{n}</button></th><td>{[...a].reverse().join('')}</td><td>{g.y}</td><td>{f.y}</td><td>{g.y!==f.y?'✓':'—'}</td></tr>;})}</tbody></table></div></details>
  </div>;
}

export function DLogicLab() {
  const [kind,setKind]=useState<Gate>('AND'),[a,setA]=useState<DValue>('D'),[b,setB]=useState<DValue>('D̅');
  const result=dGate(kind,a,b);
  return <div className="lab"><p className="lab-eyebrow">五值逻辑 · 正常 / 故障 成对计算</p><div className="lab-controls"><GateControl value={kind} onChange={setKind}/><label className="select-control">输入 A<select value={a} onChange={e=>setA(e.target.value as DValue)}>{dValues.map(v=><option key={v}>{v}</option>)}</select></label><label className="select-control">输入 B<select value={b} onChange={e=>setB(e.target.value as DValue)}>{dValues.map(v=><option key={v}>{v}</option>)}</select></label></div>
    <div className="d-key"><span>0 = 0/0</span><span>1 = 1/1</span><span>D = 1/0</span><span>D̅ = 0/1</span><span>X = 尚未确定</span></div>
    <div className="value-row"><Value name={a+' '+kind+' '+b} value={result.value} emphasis={result.value==='D'||result.value==='D̅'}/><Value name="可能的 正常/故障 输出" value={result.pairs.map(p=>p.join('/')).join('，')}/></div>
    <Result detected={result.value==='D'||result.value==='D̅'}>{result.value==='D'||result.value==='D̅'?'输出保留了确定的故障差异。':result.value==='X'?'有不止一种可能输出对，五值表示记为 X；不能断言已传播。':'正常与故障输出相同，故障差异被屏蔽。'}</Result>
    <div className="table-wrap"><table className="lab-table d-table"><caption>{kind} 门的完整五值表；点击单元格选中两个输入</caption><thead><tr><th scope="col">A ＼ B</th>{dValues.map(v=><th scope="col" key={v}>{v}</th>)}</tr></thead><tbody>{dValues.map(x=><tr key={x}><th scope="row">{x}</th>{dValues.map(y=><td key={y}><button aria-label={x+' '+kind+' '+y+' = '+dGate(kind,x,y).value} className={x===a&&y===b?'active':''} onClick={()=>{setA(x);setB(y);}}>{dGate(kind,x,y).value}</button></td>)}</tr>)}</tbody></table></div>
    <p className="callout">计算时先分别处理正常电路和故障电路，再合成一个符号。X 按所有可能的 0/0、0/1、1/0、1/1 输出对保守枚举；两个输入的未知量暂不附带相关约束。若它们来自同一根线，应保留相关性，不能把这张局部门表当成全电路证明。</p>
  </div>;
}

const patterns=['0X','10','11'] as const;
type Pattern=typeof patterns[number];
const expand=(pattern:Pattern):Bit[][]=>pattern==='0X'?[[0,0],[0,1]]:pattern==='10'?[[1,0]]:[[1,1]];
export function DSearchLab() {
  const [step,setStep]=useState(0),[upper,setUpper]=useState<Pattern>('0X'),[lower,setLower]=useState<Pattern>('0X'),[backtracked,setBacktracked]=useState(false);
  const conflict=step>=2 && (upper==='11'||(step>=3&&lower==='11'));
  const tests=expand(upper).flatMap(u=>expand(lower).map(l=>[...u,...l]));
  const values:Record<string,string>={x1:'X',x2:'X',x3:'X',x4:'X',z1:'D',z2:step>=1?'1':'X',y:step>=1?'D̅':'X'};
  if(step>=2) {values.x1=upper[0];values.x2=upper[1];}
  if(step>=3) {values.x3=lower[0];values.x4=lower[1];}
  const stepLabels=['激励故障','敏化输出','证明 z₁ = 1','证明 z₂ = 1','验证输入向量'];
  const reset=()=>{setStep(0);setUpper('0X');setLower('0X');setBacktracked(false);};
  return <div className="lab"><p className="lab-eyebrow">1110 原 NAND 树 · 目标 z₁/0</p><div className="search-progress" aria-label="当前搜索步骤">{stepLabels.map((label,i)=><span key={label} className={i===step?'active':i<step?'completed':''}><b>{i+1}</b>{label}</span>)}</div>
    <Circuit title="D 搜索状态；X 表示还没赋值，不等于 0。" width={540} height={295} nodes={nandNodes(values,step>=1?['z1','y']:['z1'],'z1')} edges={nandEdges.map(e=>({...e,active:e.from==='z1'&&step>=1}))}/>
    <div className="lab-panel search-explanation" aria-live="polite"><h4>{step+1}. {stepLabels[step]}</h4>
      {step===0&&<p><b>F：z₁ = D = 1/0。</b>故障把 z₁ 固定为 0，所以正常电路必须把 z₁ 变成 1。此时还没决定如何设置 x₁、x₂。</p>}
      {step===1&&<p><b>S：z₂ = 1。</b>最终 NAND 门的另一输入置为非控制值 1，得到 y = NAND(D,1) = D̅。这是传播要求，随后必须证明 z₂ = 1 真能实现。</p>}
      {step===2&&<p><b>O：为正常 z₁ = NAND(x₁,x₂) = 1 选择一种输入赋值。</b>0X 或 10 都行；11 会让正常 z₁ = 0，与激励要求冲突。试选 11 看一次回溯。</p>}
      {step===3&&<p><b>O：为 z₂ = NAND(x₃,x₄) = 1 选择输入。</b>也需要至少一个 0。这些输入只用于传播，不承载 D。</p>}
      {step===4&&<p><b>验证：</b>把选择的原始输入代入正常与故障电路。每个向量都应得到正常 y = 0、故障 y = 1，即 D̅。X 可以展开成两种二进制值。</p>}
    </div>
    {step>=2&&<div className="lab-controls"><label className="select-control">正常 z₁ 的证明：x₁x₂<select value={upper} onChange={e=>{setUpper(e.target.value as Pattern);if(step===4)setStep(2);}}>{patterns.map(p=><option key={p} value={p}>{p}{p==='11'?'（尝试冲突分支）':''}</option>)}</select></label>{step>=3&&<label className="select-control">z₂ 的证明：x₃x₄<select value={lower} onChange={e=>{setLower(e.target.value as Pattern);if(step===4)setStep(3);}}>{patterns.map(p=><option key={p} value={p}>{p}{p==='11'?'（尝试冲突分支）':''}</option>)}</select></label>}</div>}
    {conflict?<div className="lab-conflict" role="alert"><b>冲突：</b>{upper==='11'?'x₁x₂ = 11 导致正常 z₁ = 0，无法激励 z₁/0。':'x₃x₄ = 11 导致 z₂ = 0，最终 NAND 输出被固定为 1，无法观察 D。'}<button onClick={()=>{if(upper==='11')setUpper('0X');else setLower('0X');setBacktracked(true);}}>回溯：撤销该选择，改试 0X</button></div>:backtracked&&<p className="backtrack-note">↶ 已撤销冲突分支；保留前面仍有效的激励和敏化条件。</p>}
    {step===4&&!conflict&&<div className="table-wrap"><table className="lab-table"><caption>当前分支对应的有效测试；完整搜索的 9 个测试为 t₀、t₁、t₂、t₄、t₅、t₆、t₈、t₉、t₁₀</caption><thead><tr><th>x₁x₂x₃x₄</th><th>编号（x₄x₃x₂x₁）</th><th>正常 / 故障 y</th></tr></thead><tbody>{tests.map(t=><tr key={t.join('')}><td>{t.join('')}</td><td>t{t.reduce<number>((sum,b,i)=>sum+b*2**i,0)}</td><td>{nandTree(t).y} / {nandTree(t,{node:'z1',stuck:0}).y} ✓</td></tr>)}</tbody></table></div>}
    <div className="lab-actions"><button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>上一步</button><button className="primary" onClick={()=>setStep(s=>Math.min(4,s+1))} disabled={step===4||conflict}>下一步</button><button onClick={reset}>重置搜索</button></div>
    <p className="callout">本实验保留原 NAND 树，加入可选择的冲突分支来演示回溯。z₁/0 的“证明”使用正常电路值；故障电路上的 z₁ 仍被固定为 0，不能把 D 强行改写成普通 1。</p>
  </div>;
}

