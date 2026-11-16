import { useMemo, useState } from 'react';
import { bit, seqPreset, sequential, shortestSequentialTests } from './core';
import type { Bit, Pair, SeqInput, SeqPoint } from './core';
import { MathText, Result, Value } from './shared';

type UnknownBit=Bit|'X';
const symbols:UnknownBit[]=[0,1,'X'];
const choices=(v:UnknownBit):Bit[]=>v==='X'?[0,1]:[v];
const showSet=(a:Bit[])=>new Set(a).size===1?String(a[0]):'X';
const showPairs=(pairs:Pair[])=>pairs.map(p=>p.join('/')).join(' 或 ');
function circuitValues(row:SeqPoint,fault:boolean) {
  const z1g:Bit[]=[],z1f:Bit[]=[],z2g:Bit[]=[],z2f:Bit[]=[];
  for(const [sg,sf] of row.before) for(const x1 of choices(row.input.x1)) for(const x2 of choices(row.input.x2)) {
    const g=bit(x2*sg),f=fault?0:bit(x2*sf);z1g.push(g);z1f.push(f);z2g.push(bit(x1||g));z2f.push(bit(x1||f));
  }
  return {s:showPairs(row.before),z1:showSet(z1g)+' / '+showSet(z1f),z2:showSet(z2g)+' / '+showSet(z2f),y:showSet(row.goodY)+' / '+showSet(row.faultyY)};
}
function SequentialCircuit({row,fault}:{row:SeqPoint;fault:boolean}) {
  const v=circuitValues(row,fault);
  return <div className="circuit lab-circuit"><svg viewBox="0 0 760 330" role="img" aria-label="1111 原图：z1=x2与s，z2=x1或z1，下一状态s=z2，y=x1与s。输出使用时钟前的当前状态。">
    <g className="wire"><path d="M90 70 H225"/><path d="M305 70 H345 V110 H375"/><path d="M435 125 H485"/><path d="M555 125 H640 V20 H265 V45"/><path d="M640 125 V195 H670 V225"/><path d="M90 290 H365 V140 H375"/><path d="M180 290 H590 V250 H635"/><path d="M705 250 H740"/></g>
    <circle cx="180" cy="290" r="4" className="wire-dot"/><circle cx="640" cy="125" r="4" className="wire-dot"/>
    <text x="30" y="65" className="svg-input">x₂ = {row.input.x2}</text><text x="30" y="285" className="svg-input">x₁ = {row.input.x1}</text>
    <g className={'circuit-node '+(fault?'node-fault':'')}><rect x="225" y="45" width="80" height="50" rx="9"/><text x="265" y="65" textAnchor="middle" className="node-label">z₁ · AND</text><text x="265" y="84" textAnchor="middle" className="node-value">{v.z1}</text></g>
    {fault&&<text x="265" y="120" textAnchor="middle" className="fault-label">永久 z₁/0</text>}
    <g className="circuit-node"><rect x="375" y="100" width="60" height="50" rx="9"/><text x="405" y="120" textAnchor="middle" className="node-label">z₂ · OR</text><text x="405" y="140" textAnchor="middle" className="node-value">{v.z2}</text></g>
    <g className="circuit-node state-box"><rect x="485" y="90" width="70" height="70" rx="5"/><text x="520" y="116" textAnchor="middle" className="node-label">D FF</text><text x="520" y="144" textAnchor="middle" className="node-value">帧末 ↑</text></g>
    <path d="M512 160 L520 150 L528 160" className="wire"/><path d="M520 160 V190" className="wire"/><text x="520" y="211" textAnchor="middle" className="wire-label">clock</text>
    <text x="607" y="96" textAnchor="middle" className="node-label">当前 s</text><text x="607" y="116" textAnchor="middle" className="node-value">{v.s}</text>
    <g className={'circuit-node '+(row.guaranteedDetection?'node-active':'')}><rect x="635" y="225" width="70" height="50" rx="9"/><text x="670" y="246" textAnchor="middle" className="node-label">y · AND</text><text x="670" y="266" textAnchor="middle" className="node-value">{v.y}</text></g>
    <text x="450" y="14" textAnchor="middle" className="wire-label">状态反馈：本帧用旧 s</text>
  </svg><p className="diagram-caption">原课件 1111 电路。所有成对数值按 正常 / 故障 排列；D 触发器在帧末统一更新。</p></div>;
}

export default function SequentialLab() {
  const [inputs,setInputs]=useState<SeqInput[]>(seqPreset.map(x=>({...x}))),[initial,setInitial]=useState<UnknownBit>('X'),[fault,setFault]=useState(true),[selected,setSelected]=useState(0),[validated,setValidated]=useState(false);
  const rows=useMemo(()=>sequential(inputs,initial,fault),[inputs,initial,fault]);
  const row=rows[Math.min(selected,rows.length-1)];
  const minimum=useMemo(()=>validated?shortestSequentialTests():null,[validated]);
  const edit=(i:number,key:keyof SeqInput,value:UnknownBit)=>setInputs(old=>old.map((item,j)=>j===i?{...item,[key]:value}:item));
  const preset=()=>{setInputs(seqPreset.map(x=>({...x})));setInitial('X');setFault(true);setSelected(0);};
  const detected=rows.findIndex(r=>r.guaranteedSoFar);
  return <div className="lab sequential-lab"><p className="lab-eyebrow">1111 原电路 · 每帧永久注入 z₁/0</p>
    <div className="formula"><MathText>{'z_1=x_2s,\\quad z_2=x_1+z_1,\\quad y=x_1s,\\quad s^{k+1}=z_2^k'}</MathText></div>
    <div className="lab-controls"><label className="select-control">共同初始状态 s<select value={initial} onChange={e=>setInitial(e.target.value==='X'?'X':Number(e.target.value) as Bit)}>{symbols.map(v=><option key={v} value={v}>{v==='X'?'X（未知：可能为 0 或 1）':v}</option>)}</select></label><label className="checkbox-control"><input type="checkbox" checked={fault} onChange={e=>setFault(e.target.checked)}/>启用永久 z₁/0 故障</label><button onClick={preset}>课件预设：101 / X1X</button></div>
    <div className="timing-rule"><b>每一帧的顺序</b><span>① 读进入状态 s</span><span>→</span><span>② 计算并观察 y</span><span>→</span><span>③ 时钟沿更新 s ← z₂</span></div>
    <div className="frame-heading"><h4>正在观察第 {row.index+1} 帧</h4><div className="lab-actions"><button onClick={()=>setSelected(i=>Math.max(0,i-1))} disabled={selected===0}>← 上一帧</button><button onClick={()=>setSelected(i=>Math.min(rows.length-1,i+1))} disabled={selected===rows.length-1}>下一帧 →</button></div></div>
    <SequentialCircuit row={row} fault={fault}/>
    <div className="value-row"><Value name="进入状态 s（正常/故障）" value={showPairs(row.before)}/><Value name="先观察 y（正常/故障）" value={showSet(row.goodY)+' / '+showSet(row.faultyY)} emphasis={row.guaranteedDetection}/><Value name="时钟后状态 s′" value={showPairs(row.after)}/></div>
    <Result detected={row.guaranteedDetection}>{row.guaranteedDetection?'本帧必然检测到故障：所有允许的初态与 X 取值都产生输出差异。':row.possibleDetection?'某些初态或 X 取值可以检测，但还不是保证成功的测试。':'本帧输出没有故障差异。'}{!fault?' 故障已关闭，两条电路完全相同。':''}</Result>
    <div className="table-wrap"><table className="lab-table timeline-table"><caption>直接编辑输入；X 枚举 0、1 两种取值，保留正常与故障状态之间的对应关系</caption><thead><tr><th>帧</th><th>x₁</th><th>x₂</th><th>进入 s<br/>正常/故障</th><th>时钟前 y<br/>正常/故障</th><th>时钟后 s′<br/>正常/故障</th><th>保证检测</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i} className={i===selected?'selected-row':''}><th><button onClick={()=>setSelected(i)} aria-label={'观察第'+(i+1)+'帧'}>{i+1}</button></th>{(['x1','x2'] as const).map(key=><td key={key}><select aria-label={'第'+(i+1)+'帧 '+key} value={r.input[key]} onChange={e=>edit(i,key,e.target.value==='X'?'X':Number(e.target.value) as Bit)}>{symbols.map(v=><option key={v}>{v}</option>)}</select></td>)}<td>{showPairs(r.before)}</td><td className={r.guaranteedDetection?'detected-cell':''}>{showSet(r.goodY)} / {showSet(r.faultyY)}</td><td>{showPairs(r.after)}</td><td>{r.guaranteedDetection?'✓ 是':r.possibleDetection?'仅部分情况':'—'}</td></tr>)}</tbody></table></div>
    <div className="lab-actions"><button onClick={()=>setInputs(old=>[...old,{x1:0,x2:0}])} disabled={inputs.length>=6}>＋ 添加一帧</button><button onClick={()=>{setInputs(old=>old.slice(0,-1));setSelected(i=>Math.min(i,inputs.length-2));}} disabled={inputs.length<=1}>删除最后一帧</button><button onClick={()=>{setInputs([{x1:1,x2:'X'},{x1:0,x2:0},{x1:1,x2:'X'}]);setInitial('X');setFault(true);setSelected(2);}}>反例：中间 x₂ 改成 0</button><button onClick={()=>{setInitial(1);setFault(true);setInputs([{x1:0,x2:1},{x1:1,x2:'X'}]);setSelected(1);}}>已知 s=1：试两帧</button></div>
    <p className="callout">{detected>=0?'截至第 '+(detected+1)+' 帧，所有允许情况都已至少检测到一次故障。':'当前序列尚不能保证每种允许情况都检测到故障。'} 在预设第三帧，先观察到 y=1/0；本帧末 x₁=1 会把两条电路的状态都写成 1。不要把时钟后的 s′ 当成同一帧的输出。</p>
    <div className="lab-panel"><h4>验证“最短”需要说明初始条件</h4><p>未知共同初态为 0 或 1、只访问原始输入和输出、没有复位，且故障永久存在。在这些条件下，枚举所有短二进制序列验证最少帧数。已知初态为 1 时，两帧就够。</p><button onClick={()=>setValidated(true)} className="primary">{validated?'重新核对穷举结果':'穷举验证最短测试'}</button>
      {minimum&&<div className="validation-result" role="status"><p><b>已检查 {minimum.checked} 条序列：</b>长度 1 的 4 条、长度 2 的 16 条均无法保证检测；长度 {minimum.length} 的 64 条中有 {minimum.tests.length} 条成功。</p><p>这四条可合并为 x₁=101、x₂=X1X。点击具体序列可加载：</p><div className="fault-chips">{minimum.tests.map((t,i)=><button key={i} onClick={()=>{setInputs(t);setInitial('X');setFault(true);setSelected(2);}}>x₁={t.map(v=>v.x1).join('')} / x₂={t.map(v=>v.x2).join('')}</button>)}</div></div>}
    </div>
  </div>;
}
