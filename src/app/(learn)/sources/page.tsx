import Link from "next/link";
import { learningData } from "@/lib/data";
import { Back } from "@/components/ui";
export default async function SourcesPage() {
  const data = await learningData();
  return <section className="screen-page"><div className="page-content">
    <Back href="/settings" title="Sources et crédits" />
    <p className="lesson-copy">Les activités sont rédigées en français pour LiteCode. Les références ci-dessous indiquent les sources consultées et les adaptations du parcours.</p>
    <div className="source-list">{data.lessons.map((lesson) => <article className="source-card" key={lesson.id}>
      <h2>{lesson.title}</h2>
      <p>{lesson.attribution || "Contenu rédigé pour LiteCode."}</p>
      {lesson.license && <p><strong>Licence :</strong> {lesson.license}</p>}
      {lesson.modifications && lesson.modifications.length > 0 && <p><strong>Adaptations :</strong> {lesson.modifications.join(" · ")}</p>}
      {lesson.source_url && <a href={lesson.source_url} target="_blank" rel="noreferrer">Ouvrir la référence ↗</a>}
    </article>)}</div>
    <Link className="inline-link" href="/settings">Retour aux paramètres</Link>
  </div></section>;
}
