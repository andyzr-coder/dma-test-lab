import katex from 'katex';
export function MathText({tex, block=false}:{tex:string;block?:boolean}) {
  let html: string;
  try { html = katex.renderToString(tex,{displayMode:block,throwOnError:true,strict:false,trust:false}); }
  catch { return <code className="math-fallback">{tex}</code>; }
  return <span className={block?'math-display':'math-inline'} dangerouslySetInnerHTML={{__html:html}}/>;
}
export function Prose({text}:{text:string}) {
  return <>{text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('$')&&part.endsWith('$') ? <MathText key={i} tex={part.slice(1,-1)}/> : part.startsWith('**')&&part.endsWith('**') ? <strong key={i}>{part.slice(2,-2)}</strong> : part)}</>;
}
