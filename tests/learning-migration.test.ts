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
