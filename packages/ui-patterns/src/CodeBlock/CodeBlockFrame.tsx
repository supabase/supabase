import { type ReactNode } from 'react'
// deep import: kb renders this inside astro's config, where the `ui` barrel can't load
import { cn } from 'ui/src/lib/utils/cn'

import { getCodeBlockLabel } from './CodeBlock.utils'
import { AnnotatedSpan, type CodeAnnotation } from './CodeBlockAnnotation'

export type CodeToken = [
  content: string,
  className: string | undefined,
  annotations?: Array<CodeAnnotation>,
]

export interface CodeBlockFrameProps {
  className?: string
  lang: string | null
  lineCount: number
  compact?: boolean
  controls?: ReactNode
  children: ReactNode
}

export interface CodeBlockTokensProps {
  lines: Array<Array<CodeToken>>
  lineNumbers: boolean
}

export const CodeBlockFrame = ({
  className,
  lang,
  lineCount,
  compact = false,
  controls,
  children,
}: CodeBlockFrameProps) => (
  <div
    className={cn(
      'shiki',
      'group',
      'relative has-[.code-scroll:focus-visible]:z-1',
      'has-[.code-scroll:focus-visible]:outline-2 has-[.code-scroll:focus-visible]:outline-ring',
      'not-prose',
      'w-full',
      compact ? 'border-0 my-0!' : 'border border-default rounded-lg shadow-codeblock',
      'bg-200',
      'text-sm',
      className
    )}
  >
    <div
      className={cn(
        'code-scroll',
        'w-full overflow-x-auto overscroll-x-none',
        !compact && 'rounded-lg',
        'focus-visible:outline-hidden'
      )}
      role="group"
      aria-roledescription="code block"
      aria-label={getCodeBlockLabel(lang, lineCount)}
      tabIndex={0}
    >
      {children}
    </div>
    {/* After the code so the block is named before its controls, and outside the scroller so they stay pinned */}
    {controls}
  </div>
)

export const CodeBlockTokens = ({ lines, lineNumbers }: CodeBlockTokensProps) => (
  <pre>
    <code
      className={cn(
        '[contain:content]',
        lineNumbers && 'grid grid-cols-[auto_1fr] w-fit min-w-full py-3',
        '[--row-rest:var(--background-200)]',
        '[--row-hover:color-mix(in_srgb,var(--foreground)_3%,var(--background-200))]'
      )}
    >
      {lineNumbers ? (
        lines.map((line, idx) => (
          <div key={idx} className="group/row contents">
            <div aria-hidden="true" className="code-line-number">
              {idx + 1}
            </div>
            <div className="code-content code-line-content">
              <CodeLine tokens={line} />
            </div>
          </div>
        ))
      ) : (
        <div className="code-content p-6">
          {lines.map((line, idx) => (
            <CodeLine key={idx} tokens={line} />
          ))}
        </div>
      )}
    </code>
  </pre>
)

const CodeLine = ({ tokens }: { tokens: Array<CodeToken> }) => (
  <span className="block min-h-5 leading-5">
    {tokens.map(([content, className, annotations], idx) =>
      annotations ? (
        <AnnotatedSpan
          key={idx}
          content={content}
          className={className}
          annotations={annotations}
        />
      ) : (
        <span key={idx} className={className}>
          {content}
        </span>
      )
    )}
  </span>
)
