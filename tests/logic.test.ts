import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignments, bit, dGate, dPairs, dValues, derivativeFormula, gate, gateDerivative, gates, nandTree, not, seqPreset, sequential, shortestSequentialTests, treeNodes, treeSensitivities } from '../src/labs/core.ts';

test('gate derivative formulas equal cofactor XOR for every gate and all 16 assignments', () => {
  for (const g of gates) for (const [z,w,dz,dw] of assignments(4)) assert.equal(derivativeFormula(g,z,w,dz,dw),gateDerivative(g,z,w,dz,dw),`${g} ${z}${w}${dz}${dw}`);
});
test('all NAND tree sensitivities equal fault injection differences for every input', () => {
  for (const inputs of assignments(4)) {
    const good = nandTree(inputs), sensitivity = treeSensitivities(inputs);
    for (const node of treeNodes) {
      assert.equal(sensitivity[node], bit(good.y !== nandTree(inputs,{node,stuck:not(good[node])}).y));
      for (const stuck of [0,1] as const) assert.equal(good.y !== nandTree(inputs,{node,stuck}).y, !!(sensitivity[node] && good[node] !== stuck));
    }
  }
});
test('source NAND examples have exact expected test sets', () => {
  const tests = (node: 'x1'|'z1') => assignments(4).flatMap((a,n) => nandTree(a).y !== nandTree(a,{node,stuck:0}).y ? [n] : []);
  assert.deepEqual(tests('x1'),[3,7,11]);
  assert.deepEqual(tests('z1'),[0,1,2,4,5,6,8,9,10]);
});
test('five-valued gates preserve every concrete good/faulty possibility', () => {
  for (const g of gates) for (const a of dValues) for (const b of dValues) {
    const result = dGate(g,a,b);
    for (const x of dPairs[a]) for (const y of dPairs[b]) {
      const pair = [gate(g,x[0],y[0]),gate(g,x[1],y[1])].join('');
      assert.ok(result.pairs.some(p => p.join('') === pair));
    }
    assert.equal(result.value === 'X',result.pairs.length > 1);
  }
  assert.equal(dGate('AND','D','D̅').value,'0');
  assert.equal(dGate('OR','D','D̅').value,'1');
  assert.equal(dGate('XOR','D','D̅').value,'1');
  assert.equal(dGate('AND','0','X').value,'0');
  assert.equal(dGate('NAND','D','1').value,'D̅');
});
test('1111 sequential 101 / X1X detects permanent z1/0 for either initial state', () => {
  for (const initial of [0,1,'X'] as const) {
    const rows = sequential(seqPreset,initial);
    assert.equal(rows[2].guaranteedDetection,true);
    assert.deepEqual(rows[2].before,[[1,0]]);
    assert.deepEqual(rows[2].goodY,[1]); assert.deepEqual(rows[2].faultyY,[0]);
    assert.equal(sequential(seqPreset,initial,false).some(r=>r.possibleDetection),false);
  }
});
test('exhaustive sequential search proves minimum 3 observation frames and four binary tests', () => {
  const result = shortestSequentialTests();
  assert.equal(result.length,3); assert.equal(result.tests.length,4); assert.equal(result.checked,84);
  for(const input of result.tests) { assert.deepEqual(input.map(v=>v.x1),[1,0,1]); assert.equal(input[1].x2,1); }
});
test('1111 recurrence simulation agrees with independent direct binary simulation, all short traces', () => {
  for(const values of assignments(8)) for(const initial of [0,1] as const) for(const fault of [true,false]) {
    const inputs = Array.from({length:4},(_,i)=>({x1:values[2*i],x2:values[2*i+1]}));
    let sg=initial,sf=initial;
    const result=sequential(inputs,initial,fault);
    for(let i=0;i<4;i++) { const {x1,x2}=inputs[i]; assert.deepEqual(result[i].before,[[sg,sf]]); assert.deepEqual(result[i].goodY,[bit(x1*sg)]); assert.deepEqual(result[i].faultyY,[bit(x1*sf)]); sg=bit(x1 || (x2 && sg)); sf=bit(x1 || (!fault && x2 && sf)); }
  }
});
test('reconvergent k is identically 1 and learned contrapositive is valid', () => {
  for(const [a,b,c] of assignments(3)) {
    assert.equal(gate('NAND',gate('NOR',a,b),b),1);
    const f=bit((a*b)||(a*c));
    if(a===0) assert.equal(f,0);
    if(f===1) assert.equal(a,1);
  }
});
