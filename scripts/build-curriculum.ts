import { readFileSync, writeFileSync } from "node:fs";
import { validateCurriculum } from "../src/lib/curriculum-schema";

const curriculum = validateCurriculum(
  JSON.parse(readFileSync("curriculum/original.fr.json", "utf8")),
);
const sql = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
const jsonb = (value: unknown) => `${sql(JSON.stringify(value))}::jsonb`;
const lines = [
  "-- Generated from curriculum/original.fr.json (schemaVersion 2).",
  "begin;",
  "alter table public.lessons drop constraint if exists lessons_type_check;",
  "alter table public.lessons add constraint lessons_type_check check (type in ('lesson','exercise','multiple_choice','quiz','fill_in_the_blank','coding_challenge','debugging_exercise','project'));",
  "alter table public.lesson_versions add column if not exists ever_published boolean not null default false;",
  "update public.lesson_versions set ever_published=true where is_active and not ever_published;",
  `create or replace function public.guard_published_learning_content() returns trigger language plpgsql as $$ declare old_version uuid; new_version uuid; old_definition uuid; new_definition uuid; published boolean; begin if tg_table_name='interaction_keys' then if tg_op<>'INSERT' then old_definition:=old.definition_id; select d.version_id into old_version from public.interaction_definitions d where d.id=old_definition; end if; if tg_op<>'DELETE' then new_definition:=new.definition_id; select d.version_id into new_version from public.interaction_definitions d where d.id=new_definition; end if; else if tg_op<>'INSERT' then old_version:=old.version_id; end if; if tg_op<>'DELETE' then new_version:=new.version_id; end if; end if; select exists(select 1 from public.lesson_versions where id in (old_version,new_version) and (ever_published or is_active)) into published; if published then raise exception 'Published learning content is immutable; publish a new version'; end if; if tg_op='DELETE' then return old; else return new; end if; end $$;`,
  `create or replace function public.guard_published_version() returns trigger language plpgsql as $$ begin if tg_op='INSERT' then if new.is_active then new.ever_published:=true; end if; return new; end if; if tg_op='DELETE' then if old.ever_published or old.is_active then raise exception 'Published learning version is immutable'; end if; return old; end if; if old.ever_published and (new.lesson_id<>old.lesson_id or new.version<>old.version or new.public_content<>old.public_content or new.created_at<>old.created_at or not new.ever_published) then raise exception 'Published learning version is immutable'; end if; if new.is_active then new.ever_published:=true; end if; return new; end $$;`,
  "drop trigger if exists immutable_published_version on public.lesson_versions;",
  "create trigger immutable_published_version before insert or update or delete on public.lesson_versions for each row execute function public.guard_published_version();",
  "drop trigger if exists immutable_published_definition on public.interaction_definitions;",
  "create trigger immutable_published_definition before insert or update or delete on public.interaction_definitions for each row execute function public.guard_published_learning_content();",
  "drop trigger if exists immutable_published_key on public.interaction_keys;",
  "create trigger immutable_published_key before insert or update or delete on public.interaction_keys for each row execute function public.guard_published_learning_content();",
  "drop trigger if exists immutable_published_project on public.guided_projects;",
  "create trigger immutable_published_project before insert or update or delete on public.guided_projects for each row execute function public.guard_published_learning_content();",
  "drop trigger if exists immutable_published_project_step on public.guided_project_steps;",
  "create trigger immutable_published_project_step before insert or update or delete on public.guided_project_steps for each row execute function public.guard_published_learning_content();",
  `insert into public.courses(id,title,description) values ('javascript','JavaScript — Fondamentaux','80 activités originales, 10 étapes pour apprendre à programmer.') on conflict(id) do update set title=excluded.title, description=excluded.description;`,
];

for (const [index, module] of curriculum.modules.entries()) {
  lines.push(
    `insert into public.modules(id,course_id,title,position) values (${sql(module.id)},'javascript',${sql(module.title)},${index + 1}) on conflict(id) do update set title=excluded.title,position=excluded.position;`,
  );
}

for (const lesson of curriculum.lessons) {
  const publicContent = lesson.activity.public;
  const theoryText = publicContent.theory
    .filter((block) => block.type === "paragraph")
    .map((block) => block.segments.map((segment) => segment.text).join(""))
    .join("\n\n");
  const example = publicContent.theory.find((block) => block.type === "code");
  const instructions = publicContent.interactions.map((item) => item.prompt).join("\n");
  const modifications = lesson.modifications;
  lines.push(
    `insert into public.lessons(id,module_id,title,type,position,body,example,instructions,xp,duration_minutes,license,attribution,source_url,modifications) values (${sql(lesson.id)},${sql(lesson.moduleId)},${sql(lesson.title)},${sql(lesson.type)},${lesson.position},${sql(theoryText)},${sql(example?.code ?? "")},${sql(instructions)},${lesson.xp},${lesson.estimatedDurationMinutes},${sql(lesson.license)},${sql(lesson.attribution)},${sql(lesson.sourceReference.structureUrl)},${jsonb(modifications)}) on conflict(id) do update set module_id=excluded.module_id,title=excluded.title,type=excluded.type,position=excluded.position,body=excluded.body,example=excluded.example,instructions=excluded.instructions,xp=excluded.xp,duration_minutes=excluded.duration_minutes,license=excluded.license,attribution=excluded.attribution,source_url=excluded.source_url,modifications=excluded.modifications;`,
    `delete from public.prerequisites where lesson_id=${sql(lesson.id)};`,
    ...lesson.prerequisites.map((required) =>
      `insert into public.prerequisites(lesson_id,required_lesson_id) values (${sql(lesson.id)},${sql(required)}) on conflict do nothing;`,
    ),
    `delete from public.hints where lesson_id=${sql(lesson.id)};`,
  );
  lesson.hints.forEach((hint, i) => lines.push(
    `insert into public.hints(id,lesson_id,position,body) values (${sql(`${lesson.id}-v2-h${i + 1}`)},${sql(lesson.id)},${i + 1},${sql(hint)});`,
  ));

  const publicJson = jsonb(publicContent);
  lines.push(
    `do $$ begin if exists (select 1 from public.lesson_versions where lesson_id=${sql(lesson.id)} and version=2 and public_content<>${publicJson}) then raise exception 'Refusing changed public content for ${lesson.id} version 2'; end if; end $$;`,
    `insert into public.lesson_versions(lesson_id,version,public_content) values (${sql(lesson.id)},2,${publicJson}) on conflict(lesson_id,version) do nothing;`,
  );
  for (const interaction of publicContent.interactions) {
    const grading = lesson.activity.grading.find((entry) => entry.interactionId === interaction.id)!;
    const definitionJson = jsonb(interaction.definition);
    const keyJson = jsonb(grading.key);
    const feedbackJson = jsonb(grading.feedback ?? {});
    lines.push(
      `do $$ begin if exists (select 1 from public.interaction_definitions d join public.lesson_versions v on v.id=d.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2 and d.interaction_id=${sql(interaction.id)} and (d.kind<>${sql(interaction.definition.kind)} or d.definition<>${definitionJson})) then raise exception 'Refusing changed definition for ${lesson.id}/${interaction.id} version 2'; end if; end $$;`,
      `insert into public.interaction_definitions(version_id,interaction_id,kind,definition) select v.id,${sql(interaction.id)},${sql(interaction.definition.kind)},${definitionJson} from public.lesson_versions v where v.lesson_id=${sql(lesson.id)} and v.version=2 and not exists (select 1 from public.interaction_definitions d where d.version_id=v.id and d.interaction_id=${sql(interaction.id)});`,
      `do $$ begin if exists (select 1 from public.interaction_keys k join public.interaction_definitions d on d.id=k.definition_id join public.lesson_versions v on v.id=d.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2 and d.interaction_id=${sql(interaction.id)} and (k.answer_key<>${keyJson} or k.explanation<>${sql(grading.explanation)} or k.feedback<>${feedbackJson})) then raise exception 'Refusing changed grading key for ${lesson.id}/${interaction.id} version 2'; end if; end $$;`,
      `insert into public.interaction_keys(definition_id,answer_key,explanation,feedback) select d.id,${keyJson},${sql(grading.explanation)},${feedbackJson} from public.interaction_definitions d join public.lesson_versions v on v.id=d.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2 and d.interaction_id=${sql(interaction.id)} and not exists (select 1 from public.interaction_keys k where k.definition_id=d.id);`,
    );
  }
  if (publicContent.project) {
    lines.push(
      `do $$ begin if exists (select 1 from public.guided_projects p join public.lesson_versions v on v.id=p.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2 and p.title<>${sql(publicContent.title)}) then raise exception 'Refusing changed project for ${lesson.id} version 2'; end if; end $$;`,
      `insert into public.guided_projects(version_id,title) select id,${sql(publicContent.title)} from public.lesson_versions where lesson_id=${sql(lesson.id)} and version=2 and not exists (select 1 from public.guided_projects where version_id=public.lesson_versions.id);`,
    );
    publicContent.project.steps.forEach((interactionId, index) => lines.push(
      `insert into public.guided_project_steps(version_id,project_id,position,interaction_definition_id) select v.id,p.id,${index + 1},d.id from public.lesson_versions v join public.guided_projects p on p.version_id=v.id join public.interaction_definitions d on d.version_id=v.id and d.interaction_id=${sql(interactionId)} where v.lesson_id=${sql(lesson.id)} and v.version=2 and not exists (select 1 from public.guided_project_steps s where s.project_id=p.id and s.position=${index + 1});`,
    ));
  }
  lines.push(
    `do $$ declare expected_count integer := ${publicContent.interactions.length}; actual_count integer; begin select count(*) into actual_count from public.interaction_definitions d join public.lesson_versions v on v.id=d.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2; if actual_count<>expected_count then raise exception 'Incomplete interaction definitions for ${lesson.id}'; end if; select count(*) into actual_count from public.interaction_keys k join public.interaction_definitions d on d.id=k.definition_id join public.lesson_versions v on v.id=d.version_id where v.lesson_id=${sql(lesson.id)} and v.version=2; if actual_count<>expected_count then raise exception 'Incomplete private grading keys for ${lesson.id}'; end if; end $$;`,
  );
}

for (const achievement of [
  { id: "first", title: "Premier pas", description: "Termine ta première activité.", icon: "🌱", threshold: 1 },
  { id: "eight", title: "Premier module", description: "Termine huit activités.", icon: "💎", threshold: 8 },
  { id: "twenty", title: "En plein élan", description: "Termine vingt activités.", icon: "🛡️", threshold: 20 },
  { id: "eighty", title: "Explorateur JavaScript", description: "Termine les 80 activités.", icon: "🏆", threshold: 80 },
]) {
  lines.push(
    `insert into public.achievements(id,title,description,icon,threshold) values (${sql(achievement.id)},${sql(achievement.title)},${sql(achievement.description)},${sql(achievement.icon)},${achievement.threshold}) on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,threshold=excluded.threshold;`,
  );
}

lines.push(
  `update public.lesson_versions set is_active=false where version<>2 and lesson_id in (${curriculum.lessons.map((lesson) => sql(lesson.id)).join(",")}) and is_active;`,
  `update public.lesson_versions set is_active=true where version=2 and lesson_id in (${curriculum.lessons.map((lesson) => sql(lesson.id)).join(",")});`,
  "commit;",
);
const generated = `${lines.join("\n")}\n`;
writeFileSync("supabase/seed.sql", generated, "utf8");
writeFileSync("supabase/migrations/20261019022914_learning_curriculum_v2.sql", generated, "utf8");
console.log(`${curriculum.lessons.length} activities, ${curriculum.lessons.reduce((sum, item) => sum + item.activity.public.interactions.length, 0)} interactions; seed and v2 content migration generated.`);
