-- Server-only grading tables deliberately have no anon/authenticated SELECT grants.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Apprenti' check(char_length(display_name) between 1 and 40),
 created_at timestamptz not null default now()
);
create table public.courses (id text primary key,title text not null,description text not null);
create table public.modules (
 id text primary key,course_id text not null references public.courses(id),title text not null,
 position integer not null check(position>0),unique(course_id,position)
);
create table public.lessons (
 id text primary key,module_id text not null references public.modules(id),title text not null,
 type text not null check(type in ('lesson','multiple_choice','quiz','fill_in_the_blank','coding_challenge','debugging_exercise','project')),
 position integer not null unique,body text not null,example text not null,instructions text not null,
 xp integer not null check(xp between 0 and 100),duration_minutes integer not null check(duration_minutes>0),
 license text not null,attribution text not null,source_url text,modifications jsonb not null default '[]'
);
create table public.challenges (
 lesson_id text primary key references public.lessons(id) on delete cascade,
 starter_code text not null,steps jsonb not null default '[]',language text not null default 'javascript'
);
create table public.questions (
 id text primary key,lesson_id text not null references public.lessons(id) on delete cascade,
 prompt text not null,position integer not null default 1,kind text not null check(kind in ('choice','blank')),
 unique(lesson_id,position)
);
create table public.answer_options (
 id text primary key,question_id text not null references public.questions(id) on delete cascade,
 label text not null,value text not null,position integer not null,unique(question_id,position)
);
create table public.question_keys (
 question_id text primary key references public.questions(id) on delete cascade,answer text not null,explanation text not null
);
create table public.test_cases (
 id text primary key,lesson_id text not null references public.challenges(lesson_id) on delete cascade,
 label text not null,args jsonb not null,expected jsonb not null,position integer not null,unique(lesson_id,position)
);
create table public.hints (
 id text primary key,lesson_id text not null references public.lessons(id) on delete cascade,
 position integer not null,body text not null,unique(lesson_id,position)
);
create table public.prerequisites (
 lesson_id text references public.lessons(id) on delete cascade,
 required_lesson_id text references public.lessons(id),primary key(lesson_id,required_lesson_id),
 check(lesson_id<>required_lesson_id)
);
create table public.user_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 goal text not null default 'basics' check(goal in ('basics','career','projects','improve','curiosity')),
 languages text[] not null default array['JavaScript'],daily_goal integer not null default 15 check(daily_goal in (5,10,15,30)),
 dark_mode boolean not null default false,sound boolean not null default true,
 leaderboard_visible boolean not null default true
);
create table public.user_progress (
 user_id uuid references public.profiles(id) on delete cascade,lesson_id text references public.lessons(id),
 completed_at timestamptz,draft_code text check(char_length(draft_code)<=20000),
 hints_revealed integer not null default 0 check(hints_revealed>=0),
 project_steps jsonb not null default '[]',updated_at timestamptz not null default now(),
 primary key(user_id,lesson_id)
);
create table public.exercise_attempts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id text not null references public.lessons(id),submission jsonb not null,
 status text not null default 'pending' check(status in ('pending','passed','failed','unavailable')),
 results jsonb not null default '[]',created_at timestamptz not null default now(),finished_at timestamptz
);
create index attempts_user_time on public.exercise_attempts(user_id,created_at desc);
create index attempts_user_lesson on public.exercise_attempts(user_id,lesson_id);
create table public.user_xp_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id text not null references public.lessons(id),attempt_id uuid not null references public.exercise_attempts(id),
 amount integer not null check(amount>=0),created_at timestamptz not null default now(),unique(user_id,lesson_id)
);
create index xp_user_time on public.user_xp_events(user_id,created_at desc);
create table public.user_streaks (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 current_streak integer not null default 0,longest_streak integer not null default 0,last_activity_date date
);
create table public.achievements (id text primary key,title text not null,description text not null,icon text not null,threshold integer not null);
create table public.user_achievements (
 user_id uuid references public.profiles(id) on delete cascade,achievement_id text references public.achievements(id),
 earned_at timestamptz not null default now(),primary key(user_id,achievement_id)
);
create index progress_lesson on public.user_progress(lesson_id);
create index prerequisites_required on public.prerequisites(required_lesson_id);
create index lessons_module on public.lessons(module_id);
create index modules_course on public.modules(course_id);
create index questions_lesson on public.questions(lesson_id);
create index options_question on public.answer_options(question_id);
create index cases_lesson on public.test_cases(lesson_id);
create index hints_lesson on public.hints(lesson_id);

-- Auth provisioning is the only definer trigger; fixed search_path, no executable public API.
create schema if not exists private;
create function private.provision_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id);
 insert into public.user_settings(user_id) values(new.id);
 insert into public.user_streaks(user_id) values(new.id);
 return new;
end; $$;
revoke all on function private.provision_profile() from public,anon,authenticated;
create trigger provision_litecode after insert on auth.users for each row execute function private.provision_profile();

-- Every public table is RLS enabled. Curriculum read access never includes grading keys.
do $$ declare t text; begin
 foreach t in array array['profiles','courses','modules','lessons','challenges','questions','answer_options','question_keys','test_cases','hints','prerequisites','user_settings','user_progress','exercise_attempts','user_xp_events','user_streaks','achievements','user_achievements'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['courses','modules','lessons','challenges','questions','answer_options','prerequisites','achievements'] loop
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy curriculum_read on public.%I for select to authenticated using(true)',t);
 end loop;
 foreach t in array array['user_settings','user_progress','exercise_attempts','user_xp_events','user_streaks','user_achievements'] loop
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end; $$;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using((select auth.uid())=id);

-- INVOKER and service-role-only. The web server derives p_user from auth.getUser().
-- Profile row locking serializes submissions, rate limits and different-lesson rewards.
create function public.begin_attempt(p_user uuid,p_lesson text,p_submission jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare aid uuid; begin
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Unknown user'; end if;
 if exists(select 1 from public.prerequisites p where p.lesson_id=p_lesson and not exists(
   select 1 from public.user_progress u where u.user_id=p_user and u.lesson_id=p.required_lesson_id and u.completed_at is not null)) then
   raise exception 'Lesson locked'; end if;
 if (select count(*) from public.exercise_attempts where user_id=p_user and created_at>now()-interval '1 minute')>=12 then
   raise exception 'Too many attempts'; end if;
 insert into public.exercise_attempts(user_id,lesson_id,submission) values(p_user,p_lesson,p_submission) returning id into aid;
 return aid;
end; $$;
revoke all on function public.begin_attempt(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.begin_attempt(uuid,text,jsonb) to service_role;

create function public.finish_attempt(p_user uuid,p_attempt uuid,p_status text,p_results jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a public.exercise_attempts; reward integer:=0; amount integer; inserted integer; day date:=(now() at time zone 'UTC')::date; done_count integer;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into a from public.exercise_attempts where id=p_attempt and user_id=p_user for update;
 if not found then raise exception 'Attempt not owned'; end if;
 if a.status<>'pending' then return jsonb_build_object('xp',0,'duplicate',true); end if;
 if p_status not in ('passed','failed','unavailable') then raise exception 'Invalid status'; end if;
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

create function public.rankings(p_since timestamptz) returns table(user_id uuid,display_name text,xp bigint)
language sql security invoker set search_path='' as $$
 select p.id,p.display_name,sum(e.amount) from public.profiles p
 join public.user_settings s on s.user_id=p.id and s.leaderboard_visible
 join public.user_xp_events e on e.user_id=p.id and e.created_at>=p_since
 group by p.id,p.display_name order by sum(e.amount) desc,p.id limit 100;
$$;
revoke all on function public.rankings(timestamptz) from public,anon,authenticated;
grant execute on function public.rankings(timestamptz) to service_role;
