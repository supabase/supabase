import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a short changelog string (entry title or summary) as inline markdown,
 * so backticks become inline code and `**bold**` / `_italic_` / `~~strike~~`
 * render — e.g. "Migration of the `logs.all` endpoint to `logs`".
 *
 * Every block-level node is unwrapped to its children so the output stays inline
 * and safe to drop inside a heading (`<h1>`/`<h3>`) or a `<p>` — react-markdown
 * otherwise wraps content in a `<p>`, which is invalid inside a heading. Links
 * are unwrapped too: titles on the index and timeline are already inside a
 * `<Link>`, and a nested `<a>` would be invalid HTML.
 */
const INLINE_COMPONENTS: Components = {
  p: ({ children }) => <>{children}</>,
  a: ({ children }) => <>{children}</>,
  code: ({ children }) => (
    <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.85em] font-normal">
      {children}
    </code>
  ),
}

export function ChangelogInlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={INLINE_COMPONENTS}>
      {children}
    </ReactMarkdown>
  )
}
