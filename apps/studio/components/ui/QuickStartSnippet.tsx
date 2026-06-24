import { CodeBlock, type CodeBlockLang } from 'ui-patterns/CodeBlock'
import { cn } from 'ui'

interface QuickStartSnippetProps {
  /** Optional caption rendered above the snippet (e.g. "Or via SQL:"). */
  caption?: string
  /** The snippet body. */
  snippet: string
  /** Syntax-highlight language. */
  language: CodeBlockLang
  /** Wrapper className. */
  className?: string
}

/**
 * QuickStartSnippet — a paste-ready code snippet block that turns an empty
 * state from purely instructional copy into something a first-time user can
 * actually run in seconds. Wraps the canonical `CodeBlock` primitive (which
 * already provides syntax highlighting + a built-in copy button), so styling,
 * theming, and the copy affordance stay consistent with the rest of Studio.
 *
 * Designed to live as a child of an empty-state container
 * (`EmptyStatePresentational`, `InnerSideBarEmptyPanel`, etc.) beneath the
 * primary heading / description and any existing CTA buttons — additive,
 * not a replacement.
 */
export const QuickStartSnippet = ({
  caption,
  snippet,
  language,
  className,
}: QuickStartSnippetProps) => {
  return (
    <div className={cn('w-full max-w-[640px] mt-1', className)}>
      {caption ? (
        <p className="text-foreground-light text-xs mb-1.5 text-left">{caption}</p>
      ) : null}
      <CodeBlock language={language} className="text-xs">
        {snippet.trim()}
      </CodeBlock>
    </div>
  )
}
