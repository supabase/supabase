import { type PropsWithChildren } from 'react'
import { bundledLanguages, createHighlighter, type BundledLanguage, type ThemedToken } from 'shiki'
import { createTwoslasher, type ExtraFiles, type NodeHover } from 'twoslash'
import { cn } from 'ui'

import { AnnotatedSpan, CodeBlockControls } from './CodeBlock.client'
import { getCodeBlockLabel, getFontStyle } from './CodeBlock.utils'
import theme from './supabase-2.json' with { type: 'json' }
import denoTypes from './types/lib.deno.d.ts.include'

const extraFiles: ExtraFiles = { 'deno.d.ts': denoTypes }

const twoslasher = createTwoslasher({ extraFiles })
const TWOSLASHABLE_LANGS: ReadonlyArray<string> = ['js', 'ts', 'javascript', 'typescript']

const BUNDLED_LANGUAGES = Object.keys(bundledLanguages)
const highlighter = await createHighlighter({
  themes: [theme],
  langs: BUNDLED_LANGUAGES,
})

export async function CodeBlock({
  className,
  lang: langSetting,
  lineNumbers = true,
  contents,
  children,
  skipTypeGeneration,
  hideControls = false,
}: PropsWithChildren<{
  className?: string
  lang?: string
  lineNumbers?: boolean
  contents?: string
  skipTypeGeneration?: boolean
  hideControls?: boolean
}>) {
  let code = (contents || extractCode(children)).trim()
  const lang = tryToBundledLanguage(langSetting || '') || extractLang(children)

  let twoslashed = null as null | Map<number, Map<number, Array<NodeHover>>>
  if (!skipTypeGeneration && lang && TWOSLASHABLE_LANGS.includes(lang)) {
    try {
      const { code: editedCode, nodes } = twoslasher(code)
      const hoverNodes: Array<NodeHover> = nodes.filter((node) => node.type === 'hover')
      twoslashed = annotationsByLine(hoverNodes)
      code = editedCode
    } catch (_err) {
      // Type compilation fails when imports aren't defined
    }
  }

  const { tokens } = highlighter.codeToTokens(code, {
    lang: lang || undefined,
    theme: 'Supabase Theme',
  })

  return (
    <div
      className={cn(
        'shiki',
        'group',
        'relative',
        'not-prose',
        'w-full',
        'border border-default rounded-lg',
        'bg-200 shadow-codeblock',
        'text-sm',
        className
      )}
    >
      <div
        className={cn(
          'code-scroll',
          'w-full overflow-x-auto overscroll-x-none rounded-lg',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'
        )}
        role="group"
        aria-roledescription="code block"
        aria-label={getCodeBlockLabel(lang, tokens.length)}
        tabIndex={0}
      >
        <pre>
          <code
            className={cn(
              lineNumbers && 'grid grid-cols-[auto_1fr] w-fit min-w-full py-3',
              '[--row-rest:var(--background-200)]',
              '[--row-hover:color-mix(in_srgb,var(--foreground)_3%,var(--background-200))]'
            )}
          >
            {lineNumbers ? (
              tokens.map((line, idx) => (
                <div key={idx} className="group/row contents">
                  <div
                    aria-hidden="true"
                    className={cn(
                      'select-none text-right text-muted/70 pl-3 pr-2 min-h-5 leading-5',
                      'bg-[var(--row-rest)]',
                      'sticky left-0 z-10',
                      'group-hover/row:text-muted group-hover/row:bg-[var(--row-hover)]',
                      'after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4',
                      '[--gutter-fade:var(--row-rest)] group-hover/row:[--gutter-fade:var(--row-hover)]',
                      'after:bg-[image:linear-gradient(to_right,var(--gutter-fade)_0%,color-mix(in_srgb,var(--gutter-fade)_85%,transparent)_25%,color-mix(in_srgb,var(--gutter-fade)_50%,transparent)_50%,color-mix(in_srgb,var(--gutter-fade)_15%,transparent)_75%,transparent_100%)]'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={cn(
                      'code-content min-h-5 leading-5 pl-3 pr-18',
                      'group-hover/row:bg-[var(--row-hover)]'
                    )}
                  >
                    <CodeLine tokens={line} twoslash={twoslashed?.get(idx)} />
                  </div>
                </div>
              ))
            ) : (
              <div className="code-content p-6">
                {tokens.map((line, idx) => (
                  <CodeLine key={idx} tokens={line} twoslash={twoslashed?.get(idx)} />
                ))}
              </div>
            )}
          </code>
        </pre>
      </div>
      {/* After the code so the block is named before its controls, and outside the scroller so they stay pinned */}
      {!hideControls && <CodeBlockControls content={code.trim()} />}
    </div>
  )
}

function CodeLine({
  tokens: rawTokens,
  twoslash,
}: {
  tokens: Array<ThemedToken>
  twoslash?: Map<number, Array<NodeHover>>
}) {
  let offset = 0
  const tokens = rawTokens.map((token) => {
    const newToken = { ...token, offset }
    offset += token.content.length
    return newToken
  })

  return (
    <span className="block min-h-5 leading-5">
      {tokens.map((token) =>
        twoslash?.has(token.offset) ? (
          <AnnotatedSpan
            key={token.offset}
            token={token}
            annotations={twoslash.get(token.offset)!}
          />
        ) : (
          <span
            key={token.offset}
            style={{ color: token.color, ...getFontStyle(token.fontStyle || 0) }}
          >
            {token.content}
          </span>
        )
      )}
    </span>
  )
}

function extractCode(children: React.ReactNode): string {
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

function extractLang(children: React.ReactNode): BundledLanguage | null {
  if (typeof children === 'string') return null
  const child = Array.isArray(children) ? children[0] : children
  if (!!child && typeof child === 'object' && 'props' in child) {
    const props = child.props
    if (!!props && typeof props === 'object' && 'className' in props) {
      const className = props.className
      if (typeof className === 'string') {
        const lang = className.split(' ').find((className) => className.startsWith('language-'))
        return lang ? tryToBundledLanguage(lang.replace('language-', '')) : null
      }
    }
  }
  return null
}

function annotationsByLine(nodes: Array<NodeHover>): Map<number, Map<number, Array<NodeHover>>> {
  const result = new Map()
  nodes.forEach((node) => {
    const line = node.line
    const char = node.character
    if (!result.has(line)) {
      result.set(line, new Map())
    }
    if (!result.get(line).has(char)) {
      result.get(line).set(char, [])
    }
    result.get(line).get(char).push(node)
  })
  return result
}

function tryToBundledLanguage(lang: string): BundledLanguage | null {
  if (BUNDLED_LANGUAGES.includes(lang)) {
    return lang as BundledLanguage
  }
  return null
}
