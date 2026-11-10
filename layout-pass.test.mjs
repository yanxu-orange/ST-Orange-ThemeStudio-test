import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runLayoutPass} from './layout-pass.mjs';

test('layout pass batches writes then reads across jobs and returns synchronous results',()=>{
 const events=[];
 function* job(id){events.push('prepare '+id);const value=yield()=>{events.push('read '+id);return id*2;};events.push('place '+id);const final=yield()=>{events.push('verify '+id);return value+1;};return final;}
 assert.deepEqual(runLayoutPass([job(1),job(2)]),[3,5]);
 assert.deepEqual(events,['prepare 1','prepare 2','read 1','read 2','place 1','place 2','verify 1','verify 2']);
});
test('layout pass handles completed and uneven jobs without delaying completed results',()=>{
 function* immediate(){return 1;}function* measured(){return yield()=>2;}
 assert.deepEqual(runLayoutPass([immediate(),measured()]),[1,2]);assert.deepEqual(runLayoutPass([]),[]);
 const failure=new Error('measurement failed');function* fails(){yield()=>{throw failure;};}
 assert.throws(()=>runLayoutPass([fails()]),error=>error===failure);
});
