-- Additive structured learning model. Existing lessons, attempts, XP and progress remain intact.
create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  version integer not null check (version > 0),
  public_content jsonb not null check (
    jsonb_typeof(public_content) = 'object'
    and pg_column_size(public_content) <= 65536
    and not (public_content ?| array['grading','answer','solution','expected','correctAnswer'])
  ),
  created_at timestamptz not null default now(),
  unique (lesson_id, version),
  unique (lesson_id, id)
);

create table public.interaction_definitions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.lesson_versions(id) on delete cascade,
  interaction_id text not null check (interaction_id ~ '^[a-z][a-z0-9-]{0,63}$'),
  kind text not null check (kind in ('choice','matching','classify','ordering','blanks','trace','debug')),
  definition jsonb not null check (jsonb_typeof(definition) = 'object' and pg_column_size(definition) <= 32768),
  unique (version_id, interaction_id),
  unique (version_id, id)
);

-- Correct answers are server-only. The table has RLS and no anon/authenticated rights or policy.
create table public.interaction_keys (
  definition_id uuid primary key references public.interaction_definitions(id) on delete cascade,
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'object' and pg_column_size(answer_key) <= 16384),
  explanation text not null default '' check (char_length(explanation) <= 1000),
  feedback jsonb not null default '{}'::jsonb check (jsonb_typeof(feedback) = 'object' and pg_column_size(feedback) <= 2048),
  updated_at timestamptz not null default now()
);

create table public.guided_projects (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null unique references public.lesson_versions(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  unique (version_id, id)
);

create table public.guided_project_steps (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null,
  project_id uuid not null references public.guided_projects(id) on delete cascade,
  position integer not null check (position > 0),
  interaction_definition_id uuid not null,
  foreign key (version_id, project_id) references public.guided_projects(version_id, id) on delete cascade,
  foreign key (version_id, interaction_definition_id) references public.interaction_definitions(version_id, id) on delete restrict,
  unique (project_id, position),
  unique (project_id, interaction_definition_id)
);

alter table public.user_progress
  add column draft_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(draft_answers) = 'object' and pg_column_size(draft_answers) <= 32768),
  add column draft_content_version_id uuid references public.lesson_versions(id) on delete set null;

alter table public.exercise_attempts
  add column content_version_id uuid references public.lesson_versions(id) on delete set null;

-- A version must belong to the same stable lesson identity as the attempt/progress row.
alter table public.exercise_attempts
  add constraint attempts_version_matches_lesson
  foreign key (lesson_id, content_version_id)
  references public.lesson_versions(lesson_id, id);
alter table public.user_progress
  add constraint progress_draft_version_matches_lesson
  foreign key (lesson_id, draft_content_version_id)
  references public.lesson_versions(lesson_id, id);

create index interaction_definitions_version on public.interaction_definitions(version_id);
create index project_steps_project on public.guided_project_steps(project_id, position);
create index attempts_content_version on public.exercise_attempts(content_version_id);

alter table public.lesson_versions enable row level security;
alter table public.interaction_definitions enable row level security;
alter table public.interaction_keys enable row level security;
alter table public.guided_projects enable row level security;
alter table public.guided_project_steps enable row level security;

revoke all on public.lesson_versions, public.interaction_definitions,
  public.interaction_keys, public.guided_projects, public.guided_project_steps
  from public, anon, authenticated;
grant all on public.lesson_versions, public.interaction_definitions,
  public.interaction_keys, public.guided_projects, public.guided_project_steps
  to service_role;

grant select on public.lesson_versions, public.interaction_definitions,
  public.guided_projects, public.guided_project_steps to authenticated;
create policy learning_versions_read on public.lesson_versions
  for select to authenticated using (true);
create policy interaction_definitions_read on public.interaction_definitions
  for select to authenticated using (true);
create policy guided_projects_read on public.guided_projects
  for select to authenticated using (true);
create policy guided_project_steps_read on public.guided_project_steps
  for select to authenticated using (true);

-- No new RPC is enabled here. Version conflicts and XP activation are implemented in step 3.
