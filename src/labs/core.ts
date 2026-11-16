export type Bit = 0 | 1;
export type Gate = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR';
export const gates: Gate[] = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];
export const bit = (value: boolean | number): Bit => value ? 1 : 0;
export const not = (a: Bit): Bit => a === 0 ? 1 : 0;
export function gate(kind: Gate, a: Bit, b: Bit): Bit {
  switch (kind) {
    case 'AND': return bit(a && b);
    case 'OR': return bit(a || b);
    case 'XOR': return bit(a !== b);
    case 'NAND': return not(bit(a && b));
    case 'NOR': return not(bit(a || b));
  }
}
export function gateDerivative(kind: Gate, z: Bit, w: Bit, dz: Bit, dw: Bit): Bit {
  return bit(gate(kind, z, w) !== gate(kind, bit(z !== dz), bit(w !== dw)));
}
export function derivativeFormula(kind: Gate, z: Bit, w: Bit, dz: Bit, dw: Bit): Bit {
  if (kind === 'XOR') return bit(dz !== dw);
  const a = kind === 'OR' || kind === 'NOR' ? not(z) : z;
  const b = kind === 'OR' || kind === 'NOR' ? not(w) : w;
  return bit((dz * b) ^ (a * dw) ^ (dz * dw));
}
export type DValue = '0' | '1' | 'D' | 'D̅' | 'X';
export type Pair = readonly [Bit, Bit];
export const dValues: DValue[] = ['0', '1', 'D', 'D̅', 'X'];
export const dPairs: Record<DValue, readonly Pair[]> = {
  '0': [[0, 0]], '1': [[1, 1]], D: [[1, 0]], 'D̅': [[0, 1]],
  X: [[0, 0], [0, 1], [1, 0], [1, 1]],
};
export function dGate(kind: Gate, a: DValue, b: DValue): { value: DValue; pairs: Pair[] } {
  const seen = new Map<string, Pair>();
  for (const x of dPairs[a]) for (const y of dPairs[b]) {
    const pair: Pair = [gate(kind, x[0], y[0]), gate(kind, x[1], y[1])];
    seen.set(pair.join(''), pair);
  }
  const pairs = [...seen.values()];
  const value: DValue = pairs.length !== 1 ? 'X' : ({ '00': '0', '11': '1', '10': 'D', '01': 'D̅' } as const)[pairs[0].join('') as '00' | '11' | '10' | '01'];
  return { value, pairs };
}
export const treeNodes = ['x1', 'x2', 'x3', 'x4', 'z1', 'z2', 'y'] as const;
export type TreeNode = typeof treeNodes[number];
export type TreeValues = Record<TreeNode, Bit>;
export interface Fault { node: TreeNode; stuck: Bit; }
export function nandTree(inputs: readonly Bit[], fault?: Fault): TreeValues {
  const set = (node: TreeNode, value: Bit): Bit => fault?.node === node ? fault.stuck : value;
  const x1 = set('x1', inputs[0]), x2 = set('x2', inputs[1]);
  const x3 = set('x3', inputs[2]), x4 = set('x4', inputs[3]);
  const z1 = set('z1', gate('NAND', x1, x2)), z2 = set('z2', gate('NAND', x3, x4));
  return { x1, x2, x3, x4, z1, z2, y: set('y', gate('NAND', z1, z2)) };
}
export function treeSensitivities(inputs: readonly Bit[]): Record<TreeNode, Bit> {
  const v = nandTree(inputs);
  return { y: 1, z1: v.z2, z2: v.z1,
    x1: bit(v.x2 * v.z2), x2: bit(v.x1 * v.z2),
    x3: bit(v.x4 * v.z1), x4: bit(v.x3 * v.z1) };
}
export const assignments = (count: number): Bit[][] => Array.from({ length: 2 ** count }, (_, n) => Array.from({ length: count }, (_, i) => bit((n >> i) & 1)));
export interface SeqInput { x1: Bit | 'X'; x2: Bit | 'X'; }
export interface SeqPoint {
  index: number; input: SeqInput; before: Pair[]; after: Pair[];
  goodY: Bit[]; faultyY: Bit[]; guaranteedDetection: boolean; possibleDetection: boolean;
  guaranteedSoFar: boolean; possibleSoFar: boolean;
}
function uniquePairs(pairs: Pair[]): Pair[] { return [...new Map(pairs.map(p => [p.join(''), p])).values()]; }
const choices = (v: Bit | 'X'): Bit[] => v === 'X' ? [0, 1] : [v];
export function sequential(inputs: SeqInput[], initial: Bit | 'X', fault = true): SeqPoint[] {
  // Same initial state in the good and faulty circuits; uncertainty stays correlated.
  let histories = (initial === 'X' ? [0, 1] as Bit[] : [initial]).map(s => ({ pair: [s, s] as Pair, seen: false }));
  return inputs.map((input, index) => {
    const before = uniquePairs(histories.map(h => h.pair)), goodY: Bit[] = [], faultyY: Bit[] = [], detects: boolean[] = [];
    const next = new Map<string, { pair: Pair; seen: boolean }>();
    for (const history of histories) for (const x1 of choices(input.x1)) for (const x2 of choices(input.x2)) {
      const [sg, sf] = history.pair;
      const yg = bit(x1 * sg), yf = bit(x1 * sf);
      goodY.push(yg); faultyY.push(yf); detects.push(yg !== yf);
      const zg = bit(x2 * sg), zf = fault ? 0 : bit(x2 * sf);
      const pair: Pair = [bit(x1 || zg), bit(x1 || zf)], seen = history.seen || yg !== yf;
      // Keep the detection flag when merging identical states; it is needed for sequence guarantees.
      next.set(pair.join('') + Number(seen), { pair, seen });
    }
    histories = [...next.values()];
    return { index, input, before, after: uniquePairs(histories.map(h => h.pair)), goodY: [...new Set(goodY)], faultyY: [...new Set(faultyY)], guaranteedDetection: detects.every(Boolean), possibleDetection: detects.some(Boolean), guaranteedSoFar: histories.every(h => h.seen), possibleSoFar: histories.some(h => h.seen) };
  });
}
export function shortestSequentialTests(maxLength = 4): { length: number; tests: SeqInput[][]; checked: number } {
  let checked = 0;
  for (let length = 1; length <= maxLength; length++) {
    const tests: SeqInput[][] = [];
    for (let n = 0; n < 4 ** length; n++) {
      const input = Array.from({ length }, (_, i) => ({ x1: bit((n >> (i * 2)) & 1), x2: bit((n >> (i * 2 + 1)) & 1) }));
      checked++;
      if (sequential(input, 'X').at(-1)!.guaranteedSoFar) tests.push(input);
    }
    if (tests.length) return { length, tests, checked };
  }
  return { length: 0, tests: [], checked };
}
export const seqPreset: SeqInput[] = [{ x1: 1, x2: 'X' }, { x1: 0, x2: 1 }, { x1: 1, x2: 'X' }];
