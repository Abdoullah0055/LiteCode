import type { ReactNode } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import type { PublicActivity } from "@/lib/learning-model";

type TheoryBlock = PublicActivity["theory"][number];

function Segments({ segments }: { segments: Extract<TheoryBlock, { type: "paragraph" }>['segments'] }) {
  return <>{segments.map((segment, index) => {
    if (segment.type === "strong") return <strong key={index}>{segment.text}</strong>;
    if (segment.type === "code") return <code key={index}>{segment.text}</code>;
    return <span key={index}>{segment.text}</span>;
  })}</>;
}

function ListItem({ segments }: { segments: Extract<TheoryBlock, { type: "paragraph" }>['segments'] }) {
  return <><Segments segments={segments} /></>;
}

function Block({ block }: { block: TheoryBlock }): ReactNode {
  switch (block.type) {
    case "heading": {
      const Heading = block.level === 2 ? "h2" : "h3";
      return <Heading className="theory-heading">{block.text}</Heading>;
    }
    case "paragraph": return <p className="theory-paragraph"><Segments segments={block.segments} /></p>;
    case "code": return <figure className="theory-code" aria-label={`Code, ${block.language === "javascript" ? "JavaScript" : "texte"}`}>
      <figcaption>{block.language === "javascript" ? "javascript" : "texte"}</figcaption>
      <pre>{block.language === "javascript" ? (
        <code dangerouslySetInnerHTML={{ __html: Prism.highlight(block.code, Prism.languages.javascript, "javascript") }} />
      ) : <code>{block.code}</code>}</pre>
      {block.output !== undefined && <div className="theory-output"><span>Résultat</span><output aria-label="Résultat">{block.output}</output></div>}
    </figure>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List className="theory-list">{block.items.map((item, index) => <li key={index}><ListItem segments={item} /></li>)}</List>;
    }
    case "note": return <aside className={`theory-note theory-note-${block.tone}`}><Segments segments={block.segments} /></aside>;
  }
}

export function TheoryContent({ blocks }: { blocks: TheoryBlock[] }) {
  return <div className="theory-content">{blocks.map((block, index) => <Block key={index} block={block} />)}</div>;
}
