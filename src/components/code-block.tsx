import Prism from "prismjs";
import "prismjs/components/prism-javascript";
export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="codebox">
      <div className="code-head">
        <span>javascript</span>
        <span aria-hidden="true">{"{ }"}</span>
      </div>
      <pre className="code-body">
        <code
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(
              code,
              Prism.languages.javascript,
              "javascript",
            ),
          }}
        />
      </pre>
    </div>
  );
}
