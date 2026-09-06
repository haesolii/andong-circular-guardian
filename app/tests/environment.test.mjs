import {test} from 'node:test';
import assert from 'node:assert/strict';
import {villages,demoVerifications,predictTons,summarize,csvCell} from '../lib/environment-data.ts';
test('prediction uses hectares and kg per hectare, reporting tonnes',()=>{assert.equal(predictTons({area:10,coefficient:1240}),12.4);assert.equal(predictTons({area:0,coefficient:1240}),0);});
test('period and district filters agree across metrics',()=>{const s=summarize(villages,demoVerifications,'2027-10','임하면');assert.equal(s.selected.length,3);assert.equal(s.filtered.length,9);assert.ok(Math.abs(s.tons-30.12)<1e-9);assert.equal(s.concentrated,1);assert.equal(s.agreement,Math.round(s.matched/9*100));});
test('empty periods do not claim accuracy or generate NaN',()=>{const s=summarize(villages,[],'2027-12','임하면');assert.equal(s.tons,0);assert.equal(s.agreement,null);assert.equal(s.filtered.length,0);});
test('a new verification increments metrics and agreement denominator',()=>{const before=summarize(villages,demoVerifications,'2027-10','임하면');const s=summarize(villages,[...demoVerifications,{...demoVerifications[0],id:'live',demo:false,comparison:'예상과 유사'}],'2027-10','임하면');assert.equal(s.filtered.length,before.filtered.length+1);assert.equal(s.matched,before.matched+1);assert.equal(s.tons,before.tons);});
test('spreadsheet exports escape quotes, newlines and formula prefixes',()=>{assert.equal(csvCell('a"b'),'"a""b"');assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');assert.equal(csvCell('가\n나'),'"가\n나"');});

