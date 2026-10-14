import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTotal,validateForm} from '../src/model.js';
test('class coefficients, combined services and rounding',()=>{
  assert.equal(calculateTotal('sedan',['polish','ceramic']),42000);
  assert.equal(calculateTotal('crossover',['polish','ceramic']),52500);
  assert.equal(calculateTotal('suv',['polish','ceramic']),63000);
  assert.equal(calculateTotal('crossover',['film']),81300);
  assert.equal(calculateTotal('sedan',['polish','ceramic','film','interior','wash']),127000);
});
test('empty selection, duplicate IDs and invalid inputs',()=>{
  assert.equal(calculateTotal('sedan',[]),0);
  assert.equal(calculateTotal('sedan',['polish','polish']),18000);
  assert.throws(()=>calculateTotal('unknown',['polish']));
  assert.throws(()=>calculateTotal('sedan',['unknown']));
});
test('valid demo input and formatted Russian phone',()=>{
  assert.deepEqual(validateForm({name:'Демо',phone:'+7 (000) 000-00-00',service:'polish'}),{});
  assert.deepEqual(validateForm({name:'Демо',phone:'8 (000) 000-00-00',service:'consultation'}),{});
});
test('invalid fields and unauthorized complex selection',()=>{
  assert.equal(Object.keys(validateForm({name:'',phone:'',service:''})).length,3);
  for(const phone of ['123','+7abcdefghij','70000000000text','+10000000000']) assert.ok(validateForm({name:'Демо',phone,service:'polish'}).phone);
  assert.ok(validateForm({name:'1',phone:'70000000000',service:'complex'}).service);
  assert.deepEqual(validateForm({name:'Демо',phone:'70000000000',service:'complex'},true),{});
});
