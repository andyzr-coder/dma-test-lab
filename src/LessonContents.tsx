import type { Lesson } from './types';
export const cleanTitle=(title:string)=>title.replace(/^\d+\s*[·.、]\s*/,'');
export default function LessonContents({lesson}:{lesson:Lesson}){return <nav className="lesson-contents" aria-label="本页内容"><span>本页推导路线</span><div>{lesson.sections.map((section,i)=><button key={i} onClick={()=>document.getElementById(`section-${i}`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}><small>{String(i+1).padStart(2,'0')}</small>{cleanTitle(section.title)}</button>)}</div></nav>;}
