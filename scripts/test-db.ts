import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

async function main() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to authenticated;`);
  const migrations = readdirSync("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const u1 = "00000000-0000-4000-8000-000000000001";
  const u2 = "00000000-0000-4000-8000-000000000002";
  const u3 = "00000000-0000-4000-8000-000000000003";
  for (const migration of migrations) {
    if (migration.includes("onboarding_progress"))
      await db.query("insert into auth.users values ($1),($2)", [u1, u2]);
    await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  }
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  await db.query("insert into auth.users values ($1)", [u3]);
  const onboarding = await db.query<{ onboarding_step: string; onboarding_completed_at: string | null }>(
    "select onboarding_step,onboarding_completed_at from public.user_settings where user_id=$1",
    [u1],
  );
  assert.equal(onboarding.rows[0].onboarding_step, "complete");
  assert.ok(onboarding.rows[0].onboarding_completed_at);
  const freshOnboarding = await db.query<{ onboarding_step: string; onboarding_completed_at: string | null }>(
    "select onboarding_step,onboarding_completed_at from public.user_settings where user_id=$1",
    [u3],
  );
  assert.equal(freshOnboarding.rows[0].onboarding_step, "objectives");
  assert.equal(freshOnboarding.rows[0].onboarding_completed_at, null);
  await db.query("update public.user_settings set goal='career',onboarding_step='languages' where user_id=$1 and onboarding_step='objectives' and onboarding_completed_at is null", [u3]);
  assert.equal((await db.query<{ onboarding_step: string }>("select onboarding_step from public.user_settings where user_id=$1", [u3])).rows[0].onboarding_step, "languages");
  await db.query("update public.user_settings set languages=array['JavaScript'],onboarding_step='finish' where user_id=$1 and onboarding_step='languages' and onboarding_completed_at is null", [u3]);
  assert.equal((await db.query<{ onboarding_step: string }>("select onboarding_step from public.user_settings where user_id=$1", [u3])).rows[0].onboarding_step, "finish");
  await db.query("update public.user_settings set onboarding_step='complete',onboarding_completed_at=now() where user_id=$1 and onboarding_step='finish' and onboarding_completed_at is null", [u3]);
  assert.equal((await db.query<{ onboarding_step: string }>("select onboarding_step from public.user_settings where user_id=$1", [u3])).rows[0].onboarding_step, "complete");
  assert.equal((await db.query("update public.user_settings set onboarding_step='objectives' where user_id=$1 and onboarding_completed_at is null returning user_id", [u3])).rows.length, 0);
  let checks = 6;
  async function denied(sql: string) {
    let failed = false;
    try {
      await db.exec(sql);
    } catch {
      failed = true;
    }
    assert.ok(failed, sql);
    checks++;
  }
  await db.exec(`set role anon`);
  await denied("select * from public.lessons");
  await db.exec("reset role");
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${u1}',false)`,
  );
  assert.equal(
    (await db.query("select * from public.profiles")).rows.length,
    1,
  );
  checks++;
  await denied("select * from public.question_keys");
  await denied("select * from public.test_cases");
  await denied("select * from public.hints");
  await denied(
    `insert into public.user_xp_events(user_id,lesson_id,attempt_id,amount) values('${u1}','mvp-001',gen_random_uuid(),999)`,
  );
  await denied(
    `select public.finish_attempt('${u1}',gen_random_uuid(),'passed','[]')`,
  );
  await denied(`update public.user_progress set completed_at=now()`);
  await db.exec("reset role;set role service_role");
  await denied(`select public.begin_attempt('${u1}','mvp-002','{}')`);
  async function attempt(user: string, id: string, status: string) {
    const version = await db.query<{ id: string }>(
      "select id from public.lesson_versions where lesson_id=$1 and is_active",
      [id],
    );
    const begin = await db.query<{ id: string }>(
      "select public.begin_learning_attempt($1,$2,$3,$4) as id",
      [user, id, version.rows[0].id, { version: 2, answers: {} }],
    );
    const aid = begin.rows[0].id;
    const result = await db.query<{ r: { xp: number } }>(
      "select public.finish_attempt($1,$2,$3,$4) as r",
      [user, aid, status, []],
    );
    return { aid, ...result.rows[0].r };
  }
  assert.equal((await attempt(u1, "mvp-001", "failed")).xp, 0);
  checks++;
  const first = await attempt(u1, "mvp-001", "passed");
  assert.equal(first.xp, 10);
  checks++;
  const replay = await db.query<{ r: { xp: number } }>(
    "select public.finish_attempt($1,$2,$3,$4) as r",
    [u1, first.aid, "passed", []],
  );
  assert.equal(replay.rows[0].r.xp, 0);
  checks++;
  assert.equal((await attempt(u1, "mvp-001", "passed")).xp, 0);
  checks++;
  assert.equal((await attempt(u1, "mvp-002", "passed")).xp, 10);
  checks++;
  assert.equal((await db.query("select * from public.lesson_versions where version=2 and is_active")).rows.length, 80);
  checks++;
  assert.equal((await db.query("select * from public.interaction_definitions")).rows.length, 111);
  checks++;
  assert.equal((await db.query("select * from public.interaction_keys")).rows.length, 111);
  checks++;
  assert.equal((await db.query("select * from public.guided_projects")).rows.length, 10);
  checks++;
  assert.equal((await db.query("select * from public.achievements")).rows.length, 4);
  checks++;
  assert.equal(
    (
      await db.query("select * from public.user_xp_events where user_id=$1", [
        u1,
      ])
    ).rows.length,
    2,
  );
  checks++;
  assert.equal(
    (
      await db.query(
        "select * from public.user_achievements where user_id=$1",
        [u1],
      )
    ).rows.length,
    1,
  );
  checks++;
  const streak = await db.query<{ current_streak: number }>(
    "select * from public.user_streaks where user_id=$1",
    [u1],
  );
  assert.equal(streak.rows[0].current_streak, 1);
  checks++;
  await denied(
    `select public.finish_attempt('${u2}','${first.aid}','passed','[]')`,
  );
  await db.exec("reset role;set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [u2]);
  assert.equal(
    (await db.query("select * from public.user_progress")).rows.length,
    0,
  );
  checks++;
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [u1]);
  assert.equal(
    (
      await db.query(
        "select * from public.user_progress where completed_at is not null",
      )
    ).rows.length,
    2,
  );
  checks++;
  await db.exec("reset role");
  // Every public relation has RLS, including grading tables.
  const missing = await db.query(
    "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
  );
  assert.equal(missing.rows.length, 0);
  checks++;
  await db.exec("set role service_role");
  await denied("update public.lesson_versions set public_content='{}' where lesson_id='mvp-001' and version=2");
  await denied("update public.interaction_keys set answer_key='{}' where definition_id=(select id from public.interaction_definitions where interaction_id='roles' and version_id=(select id from public.lesson_versions where lesson_id='mvp-001' and version=2))");
  await db.exec("insert into public.lesson_versions(lesson_id,version,public_content) select lesson_id,3,public_content from public.lesson_versions where lesson_id='mvp-001' and version=2");
  await denied("update public.interaction_definitions set version_id=(select id from public.lesson_versions where lesson_id='mvp-001' and version=3) where interaction_id='roles' and version_id=(select id from public.lesson_versions where lesson_id='mvp-001' and version=2)");
  await db.exec("update public.lesson_versions set is_active=false where lesson_id='mvp-080' and version=2");
  await denied("update public.lesson_versions set public_content='{}' where lesson_id='mvp-080' and version=2");
  await denied("delete from public.lesson_versions where lesson_id='mvp-080' and version=2");
  await db.exec("insert into public.lesson_versions(lesson_id,version,public_content,is_active) select lesson_id,3,public_content,true from public.lesson_versions where lesson_id='mvp-080' and version=2");
  assert.equal((await db.query<{ ever_published: boolean }>("select ever_published from public.lesson_versions where lesson_id='mvp-080' and version=3")).rows[0].ever_published, true);
  checks++;
  await db.exec("update public.lesson_versions set is_active=false where lesson_id='mvp-080' and version=3");
  await denied("delete from public.lesson_versions where lesson_id='mvp-080' and version=3");
  await db.exec("reset role");
  // Seed replay must preserve actual learner records.
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  assert.equal(
    (await db.query("select * from public.user_xp_events")).rows.length,
    2,
  );
  checks++;
  await db.exec("set role service_role");
  await db.query(
    "update public.user_streaks set current_streak=3,last_activity_date=(now() at time zone 'UTC')::date-1 where user_id=$1",
    [u1],
  );
  await attempt(u1, "mvp-001", "passed");
  assert.equal(
    (
      await db.query<{ current_streak: number }>(
        "select current_streak from public.user_streaks where user_id=$1",
        [u1],
      )
    ).rows[0].current_streak,
    4,
  );
  checks++;
  await attempt(u1, "mvp-001", "passed");
  assert.equal(
    (
      await db.query<{ current_streak: number }>(
        "select current_streak from public.user_streaks where user_id=$1",
        [u1],
      )
    ).rows[0].current_streak,
    4,
  );
  checks++;
  await db.query(
    "update public.user_streaks set last_activity_date=(now() at time zone 'UTC')::date-3 where user_id=$1",
    [u1],
  );
  await attempt(u1, "mvp-001", "passed");
  assert.equal(
    (
      await db.query<{ current_streak: number }>(
        "select current_streak from public.user_streaks where user_id=$1",
        [u1],
      )
    ).rows[0].current_streak,
    1,
  );
  checks++;
  assert.equal(
    (await db.query("select * from public.rankings('1970-01-01')")).rows.length,
    1,
  );
  checks++;
  await db.query(
    "update public.user_settings set leaderboard_visible=false where user_id=$1",
    [u1],
  );
  assert.equal(
    (await db.query("select * from public.rankings('1970-01-01')")).rows.length,
    0,
  );
  checks++;
  await db.exec("reset role");
  console.log(
    `${checks} PostgreSQL checks passed: schema, seed, RLS, authorization, progression, XP, achievements and streaks. PGlite is not a live Supabase Auth test.`,
  );
  await db.close();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
