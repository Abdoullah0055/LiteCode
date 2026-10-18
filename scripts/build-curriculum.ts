import { readFileSync, writeFileSync } from "node:fs";
import { validateCurriculum } from "../src/lib/curriculum-schema";
const data = validateCurriculum(
  JSON.parse(readFileSync("curriculum/original.fr.json", "utf8")),
);
const literal = (value: unknown) =>
  value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value: unknown) => `${literal(JSON.stringify(value))}::jsonb`;
const lines = [
  "-- Generated from curriculum/original.fr.json. No FCC educational text imported.",
  "begin;",
];
function upsert(
  table: string,
  row: Record<string, unknown>,
  jsonKeys: string[] = [],
) {
  const keys = Object.keys(row);
  const pk =
    table === "challenges"
      ? "lesson_id"
      : table === "question_keys"
        ? "question_id"
        : "id";
  lines.push(
    `insert into public.${table} (${keys.join(",")}) values (${keys.map((k) => (jsonKeys.includes(k) ? json(row[k]) : literal(row[k]))).join(",")}) on conflict (${pk}) do update set ${keys
      .filter((k) => k !== pk)
      .map((k) => `${k}=excluded.${k}`)
      .join(",")};`,
  );
}
upsert("courses", {
  id: "javascript",
  title: "JavaScript — Fondamentaux",
  description:
    "80 activités originales, 10 étapes pour apprendre à programmer.",
});
data.modules.forEach((m, i) =>
  upsert("modules", {
    id: m.id,
    course_id: "javascript",
    title: m.title,
    position: i + 1,
  }),
);
for (const l of data.lessons) {
  upsert(
    "lessons",
    {
      id: l.id,
      module_id: l.moduleId,
      title: l.title,
      type: l.type,
      position: l.position,
      body: l.body,
      example: l.example,
      instructions: l.prompt,
      xp: l.xp,
      duration_minutes: l.estimatedDurationMinutes,
      license: l.license,
      attribution: l.attribution,
      source_url: l.sourceReference.structureUrl,
      modifications: l.modifications,
    },
    ["modifications"],
  );
  if (l.cases) {
    upsert(
      "challenges",
      {
        lesson_id: l.id,
        starter_code: l.starter!,
        steps: l.steps!,
        language: "javascript",
      },
      ["steps"],
    );
    l.cases.forEach((t, i) =>
      upsert(
        "test_cases",
        {
          id: `${l.id}-t${i}`,
          lesson_id: l.id,
          label: t.label,
          args: t.args,
          expected: t.expected,
          preserve_inputs: t.preserve_inputs || false,
          require_new_array: t.require_new_array || false,
          position: i,
        },
        ["args", "expected"],
      ),
    );
  } else {
    const qid = `${l.id}-q1`;
    upsert("questions", {
      id: qid,
      lesson_id: l.id,
      prompt: l.prompt,
      position: 1,
      kind: l.type === "fill_in_the_blank" ? "blank" : "choice",
    });
    // Deterministic rotation prevents a fixed correct-answer position; grading uses stable values.
    const options = l.choices!.map((label, i) => ({
      label,
      value: l.type === "fill_in_the_blank" ? label : String(i),
      position: (i + l.position) % l.choices!.length,
    }));
    options.forEach((o, i) =>
      upsert("answer_options", { id: `${qid}-o${i}`, question_id: qid, ...o }),
    );
    upsert("question_keys", {
      question_id: qid,
      answer: l.answer!,
      explanation: l.explanation,
    });
  }
  l.hints.forEach((body, i) =>
    upsert("hints", {
      id: `${l.id}-h${i}`,
      lesson_id: l.id,
      position: i + 1,
      body,
    }),
  );
}
for (const l of data.lessons) {
  lines.push(
    `delete from public.prerequisites where lesson_id=${literal(l.id)};`,
  );
  for (const required of l.prerequisites)
    lines.push(
      `insert into public.prerequisites values (${literal(l.id)},${literal(required)});`,
    );
}
for (const a of [
  {
    id: "first",
    title: "Premier pas",
    description: "Termine ta première activité.",
    icon: "🌱",
    threshold: 1,
  },
  {
    id: "eight",
    title: "Premier module",
    description: "Termine huit activités.",
    icon: "💎",
    threshold: 8,
  },
  {
    id: "twenty",
    title: "En plein élan",
    description: "Termine vingt activités.",
    icon: "🛡️",
    threshold: 20,
  },
  {
    id: "eighty",
    title: "Explorateur JavaScript",
    description: "Termine les 80 activités.",
    icon: "🏆",
    threshold: 80,
  },
])
  upsert("achievements", a);
lines.push("commit;");
writeFileSync("supabase/seed.sql", lines.join("\n") + "\n");
console.log(
  `${data.lessons.length} original activities validated; reproducible seed written.`,
);
