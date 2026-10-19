import { expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TheoryContent } from "../src/components/theory-content";
import { InlineCodeText } from "../src/components/inline-code-text";

it("renders structured text safely with headings, emphasis, code and output", () => {
  const html = renderToStaticMarkup(React.createElement(TheoryContent, { blocks: [
    { type: "heading", level: 2, text: "La variable" },
    { type: "paragraph", segments: [{ type: "text", text: "Texte <img src=x> " }, { type: "strong", text: "important" }, { type: "code", text: "const" }] },
    { type: "code", language: "text", code: "const x = 1", output: "1" },
  ] }));
  expect(html).toContain("<h2 class=\"theory-heading\">La variable</h2>");
  expect(html).toContain("<strong>important</strong>");
  expect(html).toContain("<code>const</code>");
  expect(html).toContain("&lt;img src=x&gt;");
  expect(html).not.toContain("<img src=x>");
  expect(html).toContain("aria-label=\"Code, texte\"");
  expect(html).toContain("aria-label=\"Résultat\"");
});

it("renders bounded backtick terms as escaped inline code", () => {
  const html = renderToStaticMarkup(React.createElement(InlineCodeText, { text: "Utilise `const <x>` puis `true`. <img src=x>" }));
  expect(html).toContain("<code>const &lt;x&gt;</code>");
  expect(html).toContain("<code>true</code>");
  expect(html).toContain("&lt;img src=x&gt;");
  expect(html).not.toContain("<img src=x>");
  expect(html).not.toContain("`true`");
});

it("highlights JavaScript while keeping text examples escaped", () => {
  const html = renderToStaticMarkup(React.createElement(TheoryContent, { blocks: [
    { type: "code", language: "javascript", code: "const score = 2;", output: "2" },
    { type: "code", language: "text", code: "<script>alert('x')</script>" },
  ] }));
  expect(html).toContain('class="token keyword"');
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
});
