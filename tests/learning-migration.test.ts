import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

it("adds versioned learning data without exposing keys or changing existing learner records", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to authenticated;`);
    await db.exec(readFileSync("supabase/migrations/20261018185124_litecode_core.sql", "utf8"));
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    const user = "00000000-0000-4000-8000-000000000101";
    await db.query("insert into auth.users values ($1)", [user]);
    const attempt = await db.query<{ id: string }>("select public.begin_attempt($1,$2,$3) as id", [user, "mvp-001", { code: "historic" }]);
    await db.query("select public.finish_attempt($1,$2,$3,$4)", [user, attempt.rows[0].id, "passed", [{ passed: true }]]);
    await db.query("update public.user_progress set draft_code='ancien brouillon' where user_id=$1 and lesson_id='mvp-001'", [user]);
    const originalXp = (await db.query("select * from public.user_xp_events where user_id=$1", [user])).rows;

    await db.exec(readFileSync("supabase/migrations/20261018193000_learning_versions.sql", "utf8"));
    expect((await db.query("select status,submission from public.exercise_attempts where id=$1", [attempt.rows[0].id])).rows[0]).toMatchObject({ status: "passed", submission: { code: "historic" } });
    expect((await db.query<{ completed_at: string | null; draft_code: string | null }>("select completed_at,draft_code from public.user_progress where user_id=$1 and lesson_id='mvp-001'", [user])).rows[0].completed_at).not.toBeNull();
    expect((await db.query<{ draft_code: string }>("select draft_code from public.user_progress where user_id=$1 and lesson_id='mvp-001'", [user])).rows[0].draft_code).toBe("ancien brouillon");
    expect((await db.query("select * from public.user_xp_events where user_id=$1", [user])).rows).toEqual(originalXp);

    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await expect(db.query("select * from public.interaction_keys")).rejects.toThrow();
    await db.exec("reset role; set role anon");
    await expect(db.query("select * from public.lesson_versions")).rejects.toThrow();
    await db.exec("reset role; set role service_role");
    await db.query("insert into public.lesson_versions(lesson_id,version,public_content) values('mvp-001',1,'{}')");
    const version = await db.query<{ id: string }>("select id from public.lesson_versions where lesson_id='mvp-001'");
    await expect(db.query("insert into public.lesson_versions(lesson_id,version,public_content) values('mvp-001',4,'{\"grading\":[]}')")).rejects.toThrow();
    await db.query("insert into public.interaction_definitions(version_id,interaction_id,kind,definition) values($1,'q1','choice','{}')", [version.rows[0].id]);
    const definition = await db.query<{ id: string }>("select id from public.interaction_definitions where version_id=$1", [version.rows[0].id]);
    await db.query("insert into public.interaction_keys(definition_id,answer_key) values($1,'{}')", [definition.rows[0].id]);
    await db.query("insert into public.guided_projects(version_id,title) values($1,'Projet')", [version.rows[0].id]);
    const project = await db.query<{ id: string }>("select id from public.guided_projects where version_id=$1", [version.rows[0].id]);
    await db.query("insert into public.guided_project_steps(version_id,project_id,position,interaction_definition_id) values($1,$2,1,$3)", [version.rows[0].id, project.rows[0].id, definition.rows[0].id]);
    await expect(db.query("insert into public.guided_project_steps(version_id,project_id,position,interaction_definition_id) values($1,$2,2,$3)", ["00000000-0000-4000-8000-000000000000", project.rows[0].id, definition.rows[0].id])).rejects.toThrow();
    await expect(db.query("insert into public.lesson_versions(lesson_id,version,public_content) values('mvp-001',1,'{}')")).rejects.toThrow();
    await expect(db.query("insert into public.lesson_versions(lesson_id,version,public_content) values('mvp-001',2,'[]')")).rejects.toThrow();

    const rls = await db.query(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('lesson_versions','interaction_definitions','interaction_keys','guided_projects','guided_project_steps') and c.relkind='r' and not c.relrowsecurity`);
    expect(rls.rows).toEqual([]);
  } finally {
    await db.close();
  }
});

it("keeps project steps reward-free, invalidates edited work, rejects stale versions and gates final XP", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to authenticated;`);
    await db.exec(readFileSync("supabase/migrations/20261018185124_litecode_core.sql", "utf8"));
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/20261018193000_learning_versions.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/20261019013608_learning_runtime.sql", "utf8"));
    const user = "00000000-0000-4000-8000-000000000111";
    const other = "00000000-0000-4000-8000-000000000112";
    await db.query("insert into auth.users values ($1),($2)", [user, other]);
    await db.query("insert into public.user_progress(user_id,lesson_id,completed_at) select $1,required_lesson_id,now() from public.prerequisites where lesson_id='mvp-004' on conflict(user_id,lesson_id) do update set completed_at=excluded.completed_at", [user]);
    const content = { id: "mvp-004", version: 1, title: "Projet", theory: [{ type: "heading", level: 2, text: "Projet" }], interactions: [
      { id: "first-step", prompt: "Première", definition: { kind: "choice", mode: "single", options: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }] } },
      { id: "second-step", prompt: "Deuxième", definition: { kind: "choice", mode: "single", options: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }] } },
      { id: "third-step", prompt: "Troisième", definition: { kind: "choice", mode: "single", options: [{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }] } },
    ], project: { steps: ["first-step", "second-step", "third-step"] } };
    await db.query("insert into public.lesson_versions(lesson_id,version,public_content,is_active) values('mvp-004',1,$1,true)", [content]);
    const version = (await db.query<{ id: string }>("select id from public.lesson_versions where lesson_id='mvp-004'")).rows[0].id;
    const definitionIds = [] as string[];
    for (const item of content.interactions) {
      await db.query("insert into public.interaction_definitions(version_id,interaction_id,kind,definition) values($1,$2,'choice',$3)", [version, item.id, item.definition]);
      definitionIds.push((await db.query<{ id: string }>("select id from public.interaction_definitions where version_id=$1 and interaction_id=$2", [version, item.id])).rows[0].id);
    }
    await db.query("insert into public.guided_projects(version_id,title) values($1,'Projet')", [version]);
    const project = (await db.query<{ id: string }>("select id from public.guided_projects where version_id=$1", [version])).rows[0].id;
    for (let index = 0; index < definitionIds.length; index++) {
      await db.query("insert into public.guided_project_steps(version_id,project_id,position,interaction_definition_id) values($1,$2,$3,$4)", [version, project, index + 1, definitionIds[index]]);
    }
    await expect(db.query("select public.begin_learning_attempt($1,'mvp-004',$2,$3)", [user, "00000000-0000-4000-8000-000000000999", { version: 1, answers: {} }])).rejects.toThrow("Learning version stale");
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.exercise_attempts where lesson_id='mvp-004'", [])).rows[0].count).toBe(0);
    const legacy = (await db.query<{ id: string }>("insert into public.exercise_attempts(user_id,lesson_id,submission) values($1,'mvp-004',$2) returning id", [user, { code: "forged" }])).rows[0].id;
    await expect(db.query("select public.finish_attempt($1,$2,'passed','[]')", [user, legacy])).rejects.toThrow("Versioned final validation required");
    await expect(db.query("select public.begin_attempt($1,'mvp-004',$2)", [user, { code: "forged" }])).rejects.toThrow("Versioned lesson requires versioned submission");
    await expect(db.query("select public.save_learning_project_step($1,$2,$3,2,'second-step',$4,'[]',true)", [user, version, project, { version: 1, answers: { "second-step": { kind: "choice", selected: ["yes"] } } }])).rejects.toThrow("Project step prerequisite missing");
    const stage = async (position: number, stepId: string, choice: string) => db.query("select public.save_learning_project_step($1,$2,$3,$4,$5,$6,$7,true)", [user, version, project, position, stepId, { version: 1, answers: { [stepId]: { kind: "choice", selected: [choice] } } }, [{ interactionId: stepId, passed: true }]]);
    await stage(1, "first-step", "yes");
    await stage(2, "second-step", "yes");
    await stage(3, "third-step", "yes");
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.user_xp_events where user_id=$1", [user])).rows[0].count).toBe(0);
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.user_progress where user_id=$1 and lesson_id='mvp-004' and completed_at is not null", [user])).rows[0].count).toBe(0);
    expect((await db.query<{ current_streak: number }>("select current_streak from public.user_streaks where user_id=$1", [user])).rows[0].current_streak).toBe(0);

    await db.query("select public.save_learning_project_step($1,$2,$3,1,'first-step',$4,$5,false)", [user, version, project,
      { version: 1, answers: { "first-step": { kind: "choice", selected: ["no"] } } }, [{ interactionId: "first-step", passed: false }]]);
    expect((await db.query<{ position: number; passed: boolean }>("select position,passed from public.learning_project_step_results where user_id=$1", [user])).rows).toEqual([{ position: 1, passed: false }]);
    await expect(db.query("select public.save_learning_project_step($1,$2,$3,2,'second-step',$4,'[]',true)", [user, version, project, { version: 1, answers: { "second-step": { kind: "choice", selected: ["yes"] } } }])).rejects.toThrow("Project step prerequisite missing");
    await stage(1, "first-step", "yes"); await stage(2, "second-step", "yes"); await stage(3, "third-step", "yes");

    const changedDraft = { version: 1, currentStep: "first-step", answers: { "first-step": { kind: "choice", selected: ["no"] } } };
    await db.query("select public.save_learning_draft($1,'mvp-004',$2,$3)", [user, version, changedDraft]);
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.learning_project_step_results where user_id=$1", [user])).rows[0].count).toBe(0);
    await stage(1, "first-step", "yes"); await stage(2, "second-step", "yes"); await stage(3, "third-step", "yes");
    const finalAnswers = { version: 1, answers: {
      "first-step": { kind: "choice", selected: ["yes"] }, "second-step": { kind: "choice", selected: ["yes"] }, "third-step": { kind: "choice", selected: ["yes"] },
    } };
    const attempt = (await db.query<{ id: string }>("select public.begin_learning_attempt($1,'mvp-004',$2,$3) as id", [user, version, finalAnswers])).rows[0].id;
    await db.query("select public.authorize_project_completion($1,$2,$3)", [user, attempt, version]);
    await db.query("select public.save_learning_draft($1,'mvp-004',$2,$3)", [user, version, changedDraft]);
    await expect(db.query("select public.finish_attempt($1,$2,'passed','[]')", [user, attempt])).rejects.toThrow("Project final validation required");
    await stage(1, "first-step", "yes"); await stage(2, "second-step", "yes"); await stage(3, "third-step", "yes");
    await db.query("select public.authorize_project_completion($1,$2,$3)", [user, attempt, version]);
    expect((await db.query<{ result: { xp: number } }>("select public.finish_attempt($1,$2,'passed','[]') as result", [user, attempt])).rows[0].result.xp).toBe(20);
    expect((await db.query<{ result: { xp: number } }>("select public.finish_attempt($1,$2,'passed','[]') as result", [user, attempt])).rows[0].result.xp).toBe(0);
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.user_xp_events where user_id=$1 and lesson_id='mvp-004'", [user])).rows[0].count).toBe(1);
    expect((await db.query<{ completed_at: string | null }>("select completed_at from public.user_progress where user_id=$1 and lesson_id='mvp-004'", [user])).rows[0].completed_at).not.toBeNull();

    // Practising an already completed project must stay possible without another reward.
    await stage(1, "first-step", "yes");
    await stage(2, "second-step", "yes");
    await stage(3, "third-step", "yes");
    await db.query("select public.save_learning_draft($1,'mvp-004',$2,$3)", [user, version, { ...finalAnswers, currentStep: "third-step" }]);
    const retry = (await db.query<{ id: string }>("select public.begin_learning_attempt($1,'mvp-004',$2,$3) as id", [user, version, finalAnswers])).rows[0].id;
    await db.query("select public.authorize_project_completion($1,$2,$3)", [user, retry, version]);
    expect((await db.query<{ result: { xp: number } }>("select public.finish_attempt($1,$2,'passed','[]') as result", [user, retry])).rows[0].result.xp).toBe(0);
    expect((await db.query<{ completed_at: string | null }>("select completed_at from public.user_progress where user_id=$1 and lesson_id='mvp-004'", [user])).rows[0].completed_at).not.toBeNull();

    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    expect((await db.query("select * from public.learning_project_step_results where version_id=$1", [version])).rows).toEqual([]);
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    expect((await db.query("select * from public.learning_project_step_results where version_id=$1", [version])).rows).toHaveLength(3);
  } finally { await db.close(); }
});
