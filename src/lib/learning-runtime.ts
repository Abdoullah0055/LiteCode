import "server-only";
import { authoredActivitySchema, type AuthoredActivity, type PublicActivity } from "./learning-model";

type Database = ReturnType<typeof import("./supabase/server").admin>;

export async function loadAuthoredActivity(server: Database, lessonId: string): Promise<{
  activity: AuthoredActivity;
  versionId: string;
  projectId: string | null;
  steps: { id: string; position: number }[];
}> {
  const { data: version, error: versionError } = await server
    .from("lesson_versions")
    .select("id,version,public_content")
    .eq("lesson_id", lessonId)
    .eq("is_active", true)
    .maybeSingle();
  if (versionError || !version) throw new Error("Version d’activité indisponible.");

  const [definitionsResult, projectResult, lessonResult] = await Promise.all([
    server.from("interaction_definitions").select("id,interaction_id,kind,definition").eq("version_id", version.id),
    server.from("guided_projects").select("id,title").eq("version_id", version.id).maybeSingle(),
    server.from("lessons").select("xp").eq("id", lessonId).maybeSingle(),
  ]);
  if (definitionsResult.error || projectResult.error || lessonResult.error || !lessonResult.data) throw new Error("Interactions indisponibles.");
  const definitions = definitionsResult.data || [];
  const [keysResult, stepsResult] = await Promise.all([
    server.from("interaction_keys").select("definition_id,answer_key,explanation,feedback").in("definition_id", definitions.map((item) => item.id)),
    projectResult.data
      ? server.from("guided_project_steps").select("position,interaction_definition_id").eq("project_id", projectResult.data.id).order("position")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (keysResult.error || stepsResult.error) throw new Error("Correction indisponible.");
  const content = version.public_content as Partial<PublicActivity>;
  const privateKeys = new Map((keysResult.data || []).map((key) => [key.definition_id, key]));
  const interactionIds = new Map(definitions.map((definition) => [definition.id, definition.interaction_id]));
  const definitionById = new Map(definitions.map((definition) => [definition.interaction_id, definition]));
  const interactions = (content.interactions || []).map((publicItem) => {
    const definition = definitionById.get(publicItem.id);
    if (!definition) throw new Error("Définition publique d’interaction manquante.");
    return { ...publicItem, definition: definition.definition };
  });
  if (interactions.length !== definitions.length) throw new Error("Interactions de la version incohérentes.");
  const steps = (stepsResult.data || []).map((step) => {
    const id = interactionIds.get(step.interaction_definition_id);
    if (!id) throw new Error("Étape de projet invalide.");
    return { id, position: step.position };
  });
  if (projectResult.data && (steps.length !== definitions.length || steps.some((step, index) => step.position !== index + 1))) throw new Error("Étapes du projet non ordonnées.");
  const publicActivity = {
    ...content,
    id: lessonId,
    version: version.version,
    interactions,
    ...(projectResult.data ? { project: { steps: steps.map((step) => step.id) } } : {}),
  };
  const grading = definitions.map((definition) => {
    const key = privateKeys.get(definition.id);
    if (!key) throw new Error("Clé de correction manquante.");
    return {
      interactionId: definition.interaction_id,
      key: key.answer_key,
      explanation: key.explanation,
      ...(key.feedback ? { feedback: key.feedback } : {}),
    };
  });
  const activity = authoredActivitySchema.parse({ public: publicActivity, grading, xp: lessonResult.data.xp });
  return { activity, versionId: version.id, projectId: projectResult.data?.id || null, steps };
}
