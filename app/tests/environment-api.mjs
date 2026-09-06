import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin='http://localhost:3000';
const field='http://localhost:3001';
const id=crypto.randomUUID();const period='2099-10';const taskId='task-'+period+'-imha-a';const reportId='report-'+period+'-전체-demo-worker-01';
const call=(body,headers={Origin:field})=>fetch(origin+'/api/environment',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const snapshot=await fetch(origin+'/api/environment').then(r=>r.json());
assert.ok(!snapshot.tasks.some(t=>t.id===taskId)&&!snapshot.reports.some(t=>t.id===reportId),'Test target must be unused');
try{
 const preflight=await fetch(origin+'/api/environment',{method:'OPTIONS',headers:{Origin:field,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),field);
 const forbidden=await call({action:'assign',villageId:'imha-a',period},{Origin:'https://not-allowed.example'});assert.equal(forbidden.status,403);
 const invalid=await call({action:'verify',id,villageId:'imha-a',period,crop:'고추',lat:0,lng:0});assert.equal(invalid.status,400);
 const payload={action:'verify',id,villageId:'imha-a',period,crop:'고추',occurrence:'발생 중',comparison:'예상과 유사',processing:'현장 보관',note:'자동 검증용 임시 기록',lat:36.52,lng:128.85,accuracy:8};
 const saved=await call(payload);assert.equal(saved.status,201);assert.equal(saved.headers.get('access-control-allow-origin'),field);
 const duplicate=await call(payload).then(r=>r.json());assert.equal(duplicate.duplicate,true);
 const assigned=await call({action:'assign',villageId:'imha-a',period,note:'자동 검증용 임시 업무'});assert.equal(assigned.status,201);
 const report=await call({action:'report',period,district:'전체',title:'자동 검증용 임시 보고서',analysis:'사용자가 작성한 분석 내용을 그대로 저장합니다.',recommendation:'검토 제안'});assert.equal(report.status,201);
 const read=await fetch(origin+'/api/environment',{headers:{Origin:field}}).then(r=>r.json());assert.equal(read.records.filter(r=>r.id===id).length,1);assert.equal(read.records.find(r=>r.id===id).lat,36.52);assert.ok(read.tasks.some(t=>t.id===taskId));assert.equal(read.reports.find(t=>t.id===reportId).analysis,'사용자가 작성한 분석 내용을 그대로 저장합니다.');
 console.log('PASS: origin checks, validation, persistence, idempotency, task sharing and report read-back');
}finally{
 const folder=resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
 const dbfile=readdirSync(folder).find(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite');
 const db=new DatabaseSync(resolve(folder,dbfile));db.exec('PRAGMA busy_timeout=5000');
 db.prepare('DELETE FROM environment_records WHERE id=?').run(id);
 db.prepare('DELETE FROM environment_documents WHERE id IN (?,?)').run(taskId,reportId);db.close();
 console.log('Temporary test records removed; existing data retained.');
}

