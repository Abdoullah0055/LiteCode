import type { ReactNode } from "react";

/** Render authoring backticks as safe, accessible inline code. */
export function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return <>{parts.map((part, index): ReactNode =>
    part.startsWith("`") && part.endsWith("`")
      ? <code key={index}>{part.slice(1, -1)}</code>
      : part,
  )}</>;
}
