import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a changelog title/summary as inline markdown (backticks → inline code).
 * `p` and `a` are unwrapped so the output is valid inside a heading and never
 * nests an anchor (titles are already wrapped in a `<Link>`).
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
