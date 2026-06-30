import 'server-only'

import { Fragment, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { bundledLanguages, createHighlighter, type BundledLanguage, type ThemedToken } from 'shiki'
import { cn } from 'ui'

import theme from '@/lib/supabase-code-theme.json' with { type: 'json' }

const bundledLanguageNames = Object.keys(bundledLanguages)
const highlighter = await createHighlighter({
  themes: [theme],
  langs: bundledLanguageNames,
})

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  lineNumbers?: boolean
}

const CodeBlock = ({ className, children, lineNumbers = true }: CodeBlockProps) => {
  const code = extractCode(children).trimEnd()
  const lang = extractLang(children)
  const { tokens } = highlighter.codeToTokens(code, {
    lang: lang || undefined,
    theme: 'Supabase Theme',
  })

  return (
    <div
      className={cn(
        'shiki group not-prose relative my-8 w-full overflow-x-auto rounded-lg border border-default bg-200 text-sm',
        className
      )}
    >
      <pre className="m-0 bg-transparent p-0 font-mono text-[13px] leading-5">
        <code className={lineNumbers ? 'grid grid-cols-[auto_1fr]' : 'block'}>
          {lineNumbers ? (
            tokens.map((line, idx) => (
              <Fragment key={idx}>
                <span
                  className={cn(
                    'select-none bg-control px-2 text-right text-muted',
                    idx === 0 && 'pt-6',
                    idx === tokens.length - 1 && 'pb-6'
                  )}
                >
                  {idx + 1}
                </span>
                <span
                  className={cn(
                    'code-content block min-h-5 pl-6 pr-6',
                    idx === 0 && 'pt-6',
                    idx === tokens.length - 1 && 'pb-6'
                  )}
                >
                  <CodeLine tokens={line} />
                </span>
              </Fragment>
            ))
          ) : (
            <span className="code-content block p-6">
              {tokens.map((line, idx) => (
                <CodeLine key={idx} tokens={line} />
              ))}
            </span>
          )}
        </code>
      </pre>
    </div>
  )
}

function CodeLine({ tokens }: { tokens: Array<ThemedToken> }) {
  let offset = 0

  return (
    <span className="block min-h-5 leading-5">
      {tokens.map((token) => {
        const key = offset
        offset += token.content.length

        return (
          <span key={key} style={{ color: token.color, ...getFontStyle(token.fontStyle || 0) }}>
            {token.content}
          </span>
        )
      })}
    </span>
  )
}

function extractCode(children: ReactNode): string {
  if (typeof children === 'string') return children
  const child = Array.isArray(children) ? children[0] : children

  if (!!child && typeof child === 'object' && 'props' in child) {
    const props = child.props
    if (!!props && typeof props === 'object' && 'children' in props) {
      const code = props.children
      if (typeof code === 'string') return code
    }
  }

  return ''
}

function extractLang(children: ReactNode): BundledLanguage | null {
  if (typeof children === 'string') return null
  const child = Array.isArray(children) ? children[0] : children

  if (!!child && typeof child === 'object' && 'props' in child) {
    const props = child.props
    if (!!props && typeof props === 'object' && 'className' in props) {
      const className = props.className
      if (typeof className === 'string') {
        const lang = className.split(' ').find((value) => value.startsWith('language-'))
        return lang ? tryToBundledLanguage(lang.replace('language-', '')) : null
      }
    }
  }

  return null
}

function tryToBundledLanguage(lang: string): BundledLanguage | null {
  if (bundledLanguageNames.includes(lang)) {
    return lang as BundledLanguage
  }

  return null
}

enum FontStyle {
  Italic = 1,
  Bold = 2,
  Underline = 4,
}

function getFontStyle(styleFlags: number): CSSProperties {
  const style: CSSProperties = {}

  if (styleFlags & FontStyle.Italic) style.fontStyle = 'italic'
  if (styleFlags & FontStyle.Bold) style.fontWeight = 'bold'
  if (styleFlags & FontStyle.Underline) style.textDecoration = 'underline'

  return style
}

export { CodeBlock }
