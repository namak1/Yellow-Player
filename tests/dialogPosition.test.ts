import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampDialog} from '../src/MovableDialog';
test('floating dialogs stay reachable at every viewport edge',()=>{
 assert.deepEqual(clampDialog({x:-300,y:-100},760,600,1400,900),{x:6,y:6});
 assert.deepEqual(clampDialog({x:1300,y:800},760,600,1400,900),{x:634,y:294});
 assert.deepEqual(clampDialog({x:200,y:100},760,600,1400,900),{x:200,y:100});
});
test('shrinking the window or enlarging dialog content keeps its title bar visible',()=>{
 assert.deepEqual(clampDialog({x:600,y:300},760,600,800,640),{x:34,y:34});
 assert.deepEqual(clampDialog({x:600,y:300},760,600,400,300),{x:6,y:6});
});
