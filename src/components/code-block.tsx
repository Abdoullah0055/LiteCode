import Prism from "prismjs";
import "prismjs/components/prism-javascript";
export function CodeBlock({ code, language = "javascript" }: { code: string; language?: "javascript" | "text" }) {
  return (
    <div className="codebox">
      <div className="code-head">
        <span>{language === "javascript" ? "javascript" : "texte"}</span>
        <span aria-hidden="true">{"{ }"}</span>
      </div>
      <pre className="code-body">
        {language === "javascript" ? <code dangerouslySetInnerHTML={{ __html: Prism.highlight(code, Prism.languages.javascript, "javascript") }} /> : <code className="plain-code">{code}</code>}
      </pre>
    </div>
  );
}
