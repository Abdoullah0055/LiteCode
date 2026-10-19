-- Versioned runtime state and atomic guards for project rewards.
alter table public.lesson_versions add column is_active boolean not null default false;
create unique index lesson_versions_one_active on public.lesson_versions(lesson_id) where is_active;

create or replace function public.begin_attempt(p_user uuid,p_lesson text,p_submission jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare aid uuid;
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Unknown user'; end if;
  if exists (select 1 from public.lesson_versions where lesson_id=p_lesson and is_active) then
    raise exception 'Versioned lesson requires versioned submission';
  end if;
  if exists(select 1 from public.prerequisites p where p.lesson_id=p_lesson and not exists(
    select 1 from public.user_progress u where u.user_id=p_user and u.lesson_id=p.required_lesson_id and u.completed_at is not null)) then
    raise exception 'Lesson locked';
  end if;
  if (select count(*) from public.exercise_attempts where user_id=p_user and created_at>now()-interval '1 minute')>=12 then
    raise exception 'Too many attempts';
  end if;
  insert into public.exercise_attempts(user_id,lesson_id,submission) values(p_user,p_lesson,p_submission) returning id into aid;
  return aid;
end; $$;
revoke all on function public.begin_attempt(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.begin_attempt(uuid,text,jsonb) to service_role;

create table public.learning_project_step_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  version_id uuid not null references public.lesson_versions(id) on delete cascade,
  project_id uuid not null references public.guided_projects(id) on delete cascade,
  position integer not null check (position > 0),
  interaction_id text not null,
  submission jsonb not null check (jsonb_typeof(submission) = 'object' and pg_column_size(submission) <= 8192),
  results jsonb not null check (jsonb_typeof(results) = 'array' and pg_column_size(results) <= 8192),
  passed boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, version_id, project_id, position),
  foreign key (version_id, project_id) references public.guided_projects(version_id, id) on delete cascade
);
alter table public.learning_project_step_results enable row level security;
revoke all on public.learning_project_step_results from public, anon, authenticated;
grant select on public.learning_project_step_results to authenticated;
grant all on public.learning_project_step_results to service_role;
create policy learning_project_step_owner_read on public.learning_project_step_results
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.project_completion_authorizations (
  attempt_id uuid primary key references public.exercise_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_id uuid not null references public.lesson_versions(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.project_completion_authorizations enable row level security;
create index project_authorizations_user_version on public.project_completion_authorizations(user_id,version_id);
revoke all on public.project_completion_authorizations from public, anon, authenticated;
grant all on public.project_completion_authorizations to service_role;

create function public.begin_learning_attempt(p_user uuid, p_lesson text, p_version_id uuid, p_submission jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare aid uuid;
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Unknown user'; end if;
  if not exists (select 1 from public.lesson_versions where id=p_version_id and lesson_id=p_lesson and is_active) then
    raise exception 'Learning version stale';
  end if;
  if exists(select 1 from public.prerequisites p where p.lesson_id=p_lesson and not exists(
    select 1 from public.user_progress u where u.user_id=p_user and u.lesson_id=p.required_lesson_id and u.completed_at is not null)) then
    raise exception 'Lesson locked';
  end if;
  if (select count(*) from public.exercise_attempts where user_id=p_user and created_at>now()-interval '1 minute')>=12 then
    raise exception 'Too many attempts';
  end if;
  insert into public.exercise_attempts(user_id,lesson_id,submission,content_version_id)
    values(p_user,p_lesson,p_submission,p_version_id) returning id into aid;
  return aid;
end; $$;
revoke all on function public.begin_learning_attempt(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.begin_learning_attempt(uuid,text,uuid,jsonb) to service_role;

create function public.save_learning_project_step(
  p_user uuid, p_version_id uuid, p_project_id uuid, p_position integer, p_interaction_id text,
  p_submission jsonb, p_results jsonb, p_passed boolean
 ) returns void language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Unknown user'; end if;
  if not exists (
    select 1 from public.guided_project_steps s
    join public.lesson_versions v on v.id=s.version_id and v.is_active
    join public.interaction_definitions d on d.id=s.interaction_definition_id and d.version_id=s.version_id and d.interaction_id=p_interaction_id
    where s.version_id=p_version_id and s.project_id=p_project_id and s.position=p_position
  ) then raise exception 'Invalid project step'; end if;
  if exists (
    select 1 from public.guided_project_steps s
    where s.project_id=p_project_id and s.position<p_position and not exists (
      select 1 from public.learning_project_step_results r where r.user_id=p_user and r.version_id=p_version_id
        and r.project_id=p_project_id and r.position=s.position and r.passed
    )
  ) then raise exception 'Project step prerequisite missing'; end if;
  -- Editing an earlier answer clears its result and every dependent step atomically.
  delete from public.project_completion_authorizations where user_id=p_user and version_id=p_version_id;
  delete from public.learning_project_step_results
    where user_id=p_user and version_id=p_version_id and project_id=p_project_id and position>=p_position;
  insert into public.learning_project_step_results(user_id,version_id,project_id,position,interaction_id,submission,results,passed,updated_at)
    values(p_user,p_version_id,p_project_id,p_position,p_interaction_id,p_submission,p_results,p_passed,now())
  on conflict(user_id,version_id,project_id,position) do update set
    interaction_id=excluded.interaction_id,submission=excluded.submission,results=excluded.results,
    passed=excluded.passed,updated_at=now();
end; $$;
revoke all on function public.save_learning_project_step(uuid,uuid,uuid,integer,text,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_learning_project_step(uuid,uuid,uuid,integer,text,jsonb,jsonb,boolean) to service_role;

create function public.authorize_project_completion(p_user uuid, p_attempt uuid, p_version_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare aid uuid; pid uuid; step_count integer; passed_count integer;
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Unknown user'; end if;
  select a.id,gp.id into aid,pid from public.exercise_attempts a
    join public.lesson_versions v on v.id=a.content_version_id and v.is_active and v.id=p_version_id
    join public.guided_projects gp on gp.version_id=v.id
    where a.id=p_attempt and a.user_id=p_user and a.status='pending';
  if aid is null then raise exception 'Project attempt unavailable'; end if;
  select count(*) into step_count from public.guided_project_steps where project_id=pid;
  select count(*) into passed_count from public.learning_project_step_results
    where user_id=p_user and version_id=p_version_id and project_id=pid and passed;
  if step_count=0 or passed_count<>step_count then raise exception 'Project steps incomplete'; end if;
  insert into public.project_completion_authorizations(attempt_id,user_id,version_id)
    values(p_attempt,p_user,p_version_id) on conflict(attempt_id) do nothing;
end; $$;
revoke all on function public.authorize_project_completion(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_project_completion(uuid,uuid,uuid) to service_role;

create function public.save_learning_draft(p_user uuid, p_lesson text, p_version_id uuid, p_draft jsonb) returns void
language plpgsql security invoker set search_path='' as $$
declare project_key uuid; changed_position integer;
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Unknown user'; end if;
  if not exists (select 1 from public.lesson_versions where id=p_version_id and lesson_id=p_lesson and is_active) then
    raise exception 'Learning version stale';
  end if;
  select id into project_key from public.guided_projects where version_id=p_version_id;
  if project_key is not null then
    select min(s.position) into changed_position
    from public.guided_project_steps s
    join public.interaction_definitions d on d.id=s.interaction_definition_id
    join public.learning_project_step_results r on r.user_id=p_user and r.version_id=p_version_id and r.project_id=project_key and r.position=s.position
    where s.project_id=project_key
      and (p_draft #> array['answers',d.interaction_id]) is distinct from (r.submission #> array['answers',d.interaction_id]);
    if changed_position is not null then
      delete from public.project_completion_authorizations where user_id=p_user and version_id=p_version_id;
      delete from public.learning_project_step_results where user_id=p_user and version_id=p_version_id and project_id=project_key and position>=changed_position;
    end if;
  end if;
  insert into public.user_progress(user_id,lesson_id,draft_answers,draft_content_version_id,updated_at)
    values(p_user,p_lesson,p_draft,p_version_id,now())
  on conflict(user_id,lesson_id) do update set draft_answers=excluded.draft_answers,
    draft_content_version_id=excluded.draft_content_version_id,updated_at=now();
end; $$;
revoke all on function public.save_learning_draft(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_learning_draft(uuid,text,uuid,jsonb) to service_role;

create or replace function public.finish_attempt(p_user uuid,p_attempt uuid,p_status text,p_results jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a public.exercise_attempts; reward integer:=0; amount integer; inserted integer; day date:=(now() at time zone 'UTC')::date; done_count integer;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into a from public.exercise_attempts where id=p_attempt and user_id=p_user for update;
 if not found then raise exception 'Attempt not owned'; end if;
 if a.status<>'pending' then return jsonb_build_object('xp',0,'duplicate',true); end if;
 if p_status not in ('passed','failed','unavailable') then raise exception 'Invalid status'; end if;
 if p_status='passed' and a.content_version_id is null and exists (
   select 1 from public.lesson_versions v where v.lesson_id=a.lesson_id and v.is_active
 ) then raise exception 'Versioned final validation required'; end if;
 if p_status='passed' and exists (
   select 1 from public.guided_projects gp where gp.version_id=a.content_version_id
 ) and not exists (
   select 1 from public.project_completion_authorizations c
   where c.attempt_id=a.id and c.user_id=p_user and c.version_id=a.content_version_id
 ) then raise exception 'Project final validation required'; end if;
 if exists(select 1 from public.prerequisites p where p.lesson_id=a.lesson_id and not exists(
   select 1 from public.user_progress u where u.user_id=p_user and u.lesson_id=p.required_lesson_id and u.completed_at is not null)) then
   raise exception 'Lesson locked'; end if;
 update public.exercise_attempts set status=p_status,results=p_results,finished_at=now() where id=a.id;
 insert into public.user_progress(user_id,lesson_id,project_steps) values(p_user,a.lesson_id,p_results)
 on conflict(user_id,lesson_id) do update set project_steps=excluded.project_steps,updated_at=now();
 if p_status='passed' then
  select xp into amount from public.lessons where id=a.lesson_id;
  insert into public.user_xp_events(user_id,lesson_id,attempt_id,amount) values(p_user,a.lesson_id,a.id,amount)
  on conflict(user_id,lesson_id) do nothing;
  get diagnostics inserted=row_count;
  if inserted=1 then reward:=amount; end if;
  update public.user_progress set completed_at=coalesce(completed_at,now()),updated_at=now() where user_id=p_user and lesson_id=a.lesson_id;
  insert into public.user_streaks(user_id,current_streak,longest_streak,last_activity_date) values(p_user,1,1,day)
  on conflict(user_id) do update set
   current_streak=case when public.user_streaks.last_activity_date=day then public.user_streaks.current_streak
     when public.user_streaks.last_activity_date=day-1 then public.user_streaks.current_streak+1 else 1 end,
   longest_streak=greatest(public.user_streaks.longest_streak,case when public.user_streaks.last_activity_date=day then public.user_streaks.current_streak
     when public.user_streaks.last_activity_date=day-1 then public.user_streaks.current_streak+1 else 1 end),last_activity_date=day;
  select count(*) into done_count from public.user_progress where user_id=p_user and completed_at is not null;
  insert into public.user_achievements(user_id,achievement_id)
   select p_user,id from public.achievements where threshold<=done_count on conflict do nothing;
 end if;
 return jsonb_build_object('xp',reward,'passed',p_status='passed');
end; $$;
revoke all on function public.finish_attempt(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.finish_attempt(uuid,uuid,text,jsonb) to service_role;
