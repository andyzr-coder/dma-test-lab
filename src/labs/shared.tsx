import { useId, useMemo } from 'react';
import katex from 'katex';
import type { Bit, Gate } from './core';
import { gates } from './core';

export function MathText({ children }: { children: string }) {
  const html = useMemo(() => katex.renderToString(children, { throwOnError: false, displayMode: false }), [children]);
  return <span className="lab-math" dangerouslySetInnerHTML={{ __html: html }} />;
}
export function BitControl({ label, value, onChange, hint }: { label: string; value: Bit; onChange: (v: Bit) => void; hint?: string }) {
  return <div className="bit-control"><span className="control-name">{label}</span><div className="segmented" role="group" aria-label={label}>{([0, 1] as const).map(n => <button key={n} type="button" className={value === n ? 'active' : ''} aria-pressed={value === n} onClick={() => onChange(n)}>{n}</button>)}</div>{hint && <small>{hint}</small>}</div>;
}
export function GateControl({ value, onChange }: { value: Gate; onChange: (g: Gate) => void }) {
  const id = useId();
  return <label className="select-control" htmlFor={id}>逻辑门<select id={id} value={value} onChange={e => onChange(e.target.value as Gate)}>{gates.map(g => <option key={g}>{g}</option>)}</select></label>;
}
export function Value({ name, value, emphasis = false }: { name: string; value: string | number; emphasis?: boolean }) {
  return <span className={`lab-value ${emphasis ? 'emphasis' : ''}`}><span>{name}</span><strong>{value}</strong></span>;
}
export function Result({ detected, children }: { detected: boolean; children: React.ReactNode }) {
  return <div className={`result lab-result ${detected ? 'is-detected' : ''}`} role="status"><span className="result-dot" />{children}</div>;
}
export interface CircuitNode { id: string; label: string; x: number; y: number; value?: string | number; active?: boolean; fault?: boolean; }
export interface CircuitEdge { from: string; to: string; label?: string; active?: boolean; }
export function Circuit({ title, nodes, edges, width = 600, height = 260, onNodeClick }: { title: string; nodes: CircuitNode[]; edges: CircuitEdge[]; width?: number; height?: number; onNodeClick?: (id: string) => void }) {
  const id = useId();
  return <div className="circuit lab-circuit"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id}><title id={id}>{title}</title>
    {edges.map((edge, i) => { const a = nodes.find(n => n.id === edge.from)!, b = nodes.find(n => n.id === edge.to)!; const middle = (a.x + b.x) / 2; return <g key={i}><path className={edge.active ? 'wire wire-active' : 'wire'} d={`M ${a.x + 34} ${a.y} H ${middle} V ${b.y} H ${b.x - 34}`} />{edge.label && <text className="wire-label" x={middle + 5} y={(a.y+b.y)/2-8}>{edge.label}</text>}</g>; })}
    {nodes.map(node => <g key={node.id} className={`circuit-node ${node.active ? 'node-active' : ''} ${node.fault ? 'node-fault' : ''} ${onNodeClick ? 'clickable' : ''}`} transform={`translate(${node.x},${node.y})`} role={onNodeClick ? 'button' : undefined} tabIndex={onNodeClick ? 0 : undefined} aria-label={`${node.label}${node.value !== undefined ? `，值${node.value}` : ''}`} onClick={onNodeClick ? () => onNodeClick(node.id) : undefined} onKeyDown={onNodeClick ? e => { if(e.key === 'Enter' || e.key === ' ') {e.preventDefault();onNodeClick(node.id);} } : undefined}><rect x="-34" y="-23" width="68" height="46" rx="9"/><text y={node.value !== undefined ? -3 : 5} textAnchor="middle" className="node-label">{node.label}</text>{node.value !== undefined && <text textAnchor="middle" y="15" className="node-value">{node.value}</text>}</g>)}
  </svg><p className="diagram-caption">{title}</p></div>;
}
export const nandNodes = (values: Record<string, string | number>, active: string[] = [], fault?: string): CircuitNode[] => [
  {id:'x1',label:'x₁',x:50,y:40},{id:'x2',label:'x₂',x:50,y:105},
  {id:'x3',label:'x₃',x:50,y:185},{id:'x4',label:'x₄',x:50,y:250},
  {id:'z1',label:'z₁ · NAND',x:245,y:75},{id:'z2',label:'z₂ · NAND',x:245,y:215},
  {id:'y',label:'y · NAND',x:475,y:145},
].map(n => ({...n,value:values[n.id],active:active.includes(n.id),fault:n.id===fault}));
export const nandEdges: CircuitEdge[] = [{from:'x1',to:'z1'},{from:'x2',to:'z1'},{from:'x3',to:'z2'},{from:'x4',to:'z2'},{from:'z1',to:'y'},{from:'z2',to:'y'}];
