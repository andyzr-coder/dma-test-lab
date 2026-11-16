export interface Progress { done:string[]; answers:Record<string,number>; }
const key='dma-lab-progress-v1';
export function getProgress():Progress { try { const p=JSON.parse(localStorage.getItem(key)||'{}'); return {done:Array.isArray(p.done)?p.done.filter((x:unknown)=>typeof x==='string'):[],answers:p.answers&&typeof p.answers==='object'?p.answers:{}}; } catch{return {done:[],answers:{}};} }
export function saveProgress(progress:Progress) {try {localStorage.setItem(key,JSON.stringify(progress));} catch{/* Reading still works when browser storage is unavailable. */}}
