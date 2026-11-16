import assert from 'node:assert/strict';
import katex from 'katex';
import { lecture1110 } from '../src/content/lecture1110';
import { lecture1111 } from '../src/content/lecture1111';
import { glossary } from '../src/content/glossary';
const lessons=[...lecture1110,...lecture1111];
assert.equal(lecture1110.length,12);assert.equal(lecture1111.length,3);
assert.equal(new Set(lessons.map(l=>l.id)).size,15);
for(const [list,date] of [[lecture1110,'1110'],[lecture1111,'1111']] as const){list.forEach((l,i)=>{assert.equal(l.page,i+1);assert.equal(l.date,date);});}
let formulas=0;
function check(tex:string){katex.renderToString(tex,{throwOnError:true,strict:false,trust:false});formulas++;}
for(const l of lessons){
 assert.ok(l.sections.length>=3,`Insufficient sections: ${l.id}`);
 assert.ok(l.quiz.answer>=0&&l.quiz.answer<l.quiz.options.length);
 l.terms.forEach(t=>check(t.symbol));
 l.sections.forEach(s=>{s.formulas?.forEach(check); for(const p of [...s.paragraphs,...(s.bullets||[])]){for(const m of p.matchAll(/\$([^$]+)\$/g))check(m[1]);}});
}
for(const g of glossary){if(g.formula)check(g.formula);}
console.log(`Validated ${lessons.length} lessons, ${glossary.length} glossary entries, ${formulas} formulas.`);
