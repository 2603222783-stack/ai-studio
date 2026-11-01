import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSvg,names} from './geometry.js';
const points=Array.from({length:14},(_,i)=>({x:.3+(i%2)*.2,y:.1+i*.05}));
test('incomplete annotation never generates a preset pose',()=>{assert.equal(makeSvg([],400,600),'');assert.equal(makeSvg(points.slice(0,13),400,600),'');assert.equal(makeSvg([...points.slice(0,13),{x:NaN,y:0}],400,600),'');assert.equal(names.length,14);});
test('export contains transparent vector geometry and reacts to corrections',()=>{const svg=makeSvg(points,400,600);assert.match(svg,/width="400" height="600"/);assert.match(svg,/<circle/);assert.match(svg,/<polygon/);assert.equal((svg.match(/<polyline/g)||[]).length,6);assert.doesNotMatch(svg,/<image|<rect/);const moved=points.map(p=>({...p}));moved[5].x=.9;assert.notEqual(makeSvg(moved,400,600),svg);assert.notEqual(makeSvg(points,400,600,{head:150,thick:150,color:'#123456'}),svg);assert.doesNotMatch(makeSvg(points,400,600,{color:'" onload="bad'}),/onload/);});
