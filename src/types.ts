export type LabId = 'difference' | 'gate-derivative' | 'reconvergence' | 'fault-tree' | 'd-logic' | 'd-search' | 'learning' | 'controllability' | 'sequential';
export interface Section { title: string; paragraphs: string[]; formulas?: string[]; bullets?: string[]; }
export interface Term { symbol: string; meaning: string; }
export interface Quiz { question: string; options: string[]; answer: number; explanation: string; }
export interface Lesson {
  id: string; date: '1110' | '1111'; page: number; title: string; subtitle: string;
  intro: string; goals: string[]; terms: Term[]; sections: Section[];
  lab?: LabId; labPrompt?: string; takeaway: string; pitfalls: string[]; quiz: Quiz;
}
