import{test}from'node:test';
import assert from'node:assert/strict';
import{ShuffleOrder,nextRepeat}from'../src/playlistPlayback';
test('repeat button cycles off, one, all, off',()=>{assert.equal(nextRepeat('off'),'one');assert.equal(nextRepeat('one'),'all');assert.equal(nextRepeat('all'),'off');});
test('shuffle covers queue once, stops, then starts a fresh cycle without immediate repetition',()=>{const order=new ShuffleOrder(),keys=['a','b','c'];const b=order.next(keys,'a',false,()=>0)!;const c=order.next(keys,b,false,()=>0)!;assert.deepEqual(new Set(['a',b,c]),new Set(keys));assert.equal(order.next(keys,c,false),undefined);assert.notEqual(order.next(keys,c,true),c);});
test('shuffle Previous and Next retrace history; removal and new files are reconciled',()=>{const o=new ShuffleOrder(),keys=['a','b','c'];assert.equal(o.next(keys,'a',false,()=>0),'b');assert.equal(o.next(keys,'b',false,()=>0),'c');assert.equal(o.previous(keys,'c'),'b');assert.equal(o.next(keys,'b',false),'c');assert.equal(o.next(['a','c','d'],'c',false),'d');assert.equal(o.previous(['a','c','d'],'d'),'c');});
test('empty/single queues and reset',()=>{const o=new ShuffleOrder();assert.equal(o.next([], '',true),undefined);assert.equal(o.next(['a'],'a',false),undefined);assert.equal(o.next(['a'],'a',true),'a');o.reset();assert.equal(o.previous(['a'],'a'),undefined);});
