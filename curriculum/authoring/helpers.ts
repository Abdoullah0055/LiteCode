import { z } from "zod";
import { authoredActivitySchema } from "../../src/lib/learning-model";

export type AuthorInput = z.input<typeof authoredActivitySchema>;
export type AuthorInteraction = Omit<AuthorInput["public"]["interactions"][number], "code"> & {
  code?: string | AuthorInput["public"]["interactions"][number]["code"];
};

export function rich(value: string) {
  const segments: { type: "text" | "strong" | "code"; text: string }[] = [];
  for (const part of value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
    if (!part) continue;
    if (part.startsWith("**")) segments.push({ type: "strong", text: part.slice(2, -2) });
    else if (part.startsWith("`")) segments.push({ type: "code", text: part.slice(1, -1) });
    else segments.push({ type: "text", text: part });
  }
  return segments;
}
export function paragraph(value: string) { return { type: "paragraph" as const, segments: rich(value) }; }
export function example(code: string, output: string) { return { type: "code" as const, language: "javascript" as const, code, output }; }
export function authored(args: {
  id: string; title: string; intro: string; code: string; output: string; detail: string;
  language?: "javascript" | "text";
  interactions: AuthorInteraction[];
  grading: AuthorInput["grading"];
  project?: AuthorInput["public"]["project"];
  additional?: { heading: string; paragraphs: string[]; example?: { code: string; output: string } }[];
  xp?: number;
}): AuthorInput {
  return {
    public: {
      id: args.id, version: 2, title: args.title,
      theory: [
        { type: "heading", level: 2, text: args.title },
        paragraph(args.intro),
        { type: "code" as const, language: args.language ?? "javascript", code: args.code, output: args.output },
        paragraph(args.detail),
        ...(args.additional || []).flatMap((section) => [
          { type: "heading" as const, level: 3 as const, text: section.heading },
          ...section.paragraphs.map(paragraph),
          ...(section.example ? [example(section.example.code, section.example.output)] : []),
        ]),
      ],
      interactions: args.interactions.map((interaction) => typeof interaction.code === "string"
        ? { ...interaction, code: { language: "javascript" as const, code: interaction.code } }
        : interaction) as AuthorInput["public"]["interactions"],
      ...(args.project ? { project: args.project } : {}),
    },
    grading: args.grading,
    xp: args.xp ?? 10,
  };
}
