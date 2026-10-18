import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

async function main(){
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to authenticated;`);
await db.exec(readFileSync('supabase/migrations/20261018185124_litecode_core.sql','utf8'));
await db.exec(readFileSync('supabase/seed.sql','utf8'));
const u1='00000000-0000-4000-8000-000000000001',u2='00000000-0000-4000-8000-000000000002';
await db.query('insert into auth.users values ($1),($2)',[u1,u2]);
let checks=0;
async function denied(sql:string){let failed=false;try{await db.exec(sql);}catch{failed=true;}assert.ok(failed,sql);checks++;}
await db.exec(`set role anon`);await denied('select * from public.lessons');await db.exec('reset role');
await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${u1}',false)`);
assert.equal((await db.query('select * from public.profiles')).rows.length,1);checks++;
await denied('select * from public.question_keys');await denied('select * from public.test_cases');await denied('select * from public.hints');
await denied(`insert into public.user_xp_events(user_id,lesson_id,attempt_id,amount) values('${u1}','mvp-001',gen_random_uuid(),999)`);
await denied(`select public.finish_attempt('${u1}',gen_random_uuid(),'passed','[]')`);
await denied(`update public.user_progress set completed_at=now()`);
await db.exec('reset role;set role service_role');
await denied(`select public.begin_attempt('${u1}','mvp-002','{}')`);
async function attempt(user:string,id:string,status:string){
 const begin=await db.query<{id:string}>('select public.begin_attempt($1,$2,$3) as id',[user,id,{}]);
 const aid=begin.rows[0].id;
 const result=await db.query<{r:{xp:number}}>('select public.finish_attempt($1,$2,$3,$4) as r',[user,aid,status,[]]);
 return {aid,...result.rows[0].r};
}
assert.equal((await attempt(u1,'mvp-001','failed')).xp,0);checks++;
const first=await attempt(u1,'mvp-001','passed');assert.equal(first.xp,10);checks++;
const replay=await db.query<{r:{xp:number}}>('select public.finish_attempt($1,$2,$3,$4) as r',[u1,first.aid,'passed',[]]);assert.equal(replay.rows[0].r.xp,0);checks++;
assert.equal((await attempt(u1,'mvp-001','passed')).xp,0);checks++;
assert.equal((await attempt(u1,'mvp-002','passed')).xp,10);checks++;
assert.equal((await db.query('select * from public.user_xp_events where user_id=$1',[u1])).rows.length,2);checks++;
assert.equal((await db.query('select * from public.user_achievements where user_id=$1',[u1])).rows.length,1);checks++;
const streak=await db.query<{current_streak:number}>('select * from public.user_streaks where user_id=$1',[u1]);assert.equal(streak.rows[0].current_streak,1);checks++;
await denied(`select public.finish_attempt('${u2}','${first.aid}','passed','[]')`);
await db.exec('reset role;set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u2]);
assert.equal((await db.query('select * from public.user_progress')).rows.length,0);checks++;
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u1]);
assert.equal((await db.query('select * from public.user_progress where completed_at is not null')).rows.length,2);checks++;
await db.exec('reset role');
// Every public relation has RLS, including grading tables.
const missing=await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity");assert.equal(missing.rows.length,0);checks++;
console.log(`${checks} PostgreSQL checks passed: schema, seed, RLS, authorization, progression, XP, achievements and streaks. PGlite is not a live Supabase Auth test.`);
await db.close();
}
main().catch(error=>{console.error(error);process.exitCode=1;});
