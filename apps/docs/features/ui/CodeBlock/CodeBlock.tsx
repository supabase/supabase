import { type PropsWithChildren } from 'react'
import { bundledLanguages, createHighlighter, type BundledLanguage, type ThemedToken } from 'shiki'
import { createTwoslasher, type ExtraFiles, type NodeHover } from 'twoslash'
import { cn } from 'ui'

import { AnnotatedSpan, CodeCopyButton } from './CodeBlock.client'
import { getFontStyle } from './CodeBlock.utils'
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
}: PropsWithChildren<{
  className?: string
  lang?: string
  lineNumbers?: boolean
  contents?: string
  skipTypeGeneration?: boolean
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
      // Silently ignore, if imports aren't defined type compilation fails
      // Uncomment lines below to debug in dev
      // console.log('\n==========CODE==========\n')
      // console.log(code)
      // console.error(_err.recommendation)
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
        'w-full overflow-hidden',
        'border border-default rounded-lg',
        'bg-200',
        'text-sm',
        className
      )}
    >
      <pre>
        <code className={lineNumbers ? 'flex' : ''}>
          {lineNumbers && (
            <div className="flex-shrink-0 select-none text-right text-muted bg-control py-6 px-2">
              {tokens.map((_, idx) => (
                <div key={idx} className="w-full">
                  {idx + 1}
                </div>
              ))}
            </div>
          )}
          <div className={cn('p-6 overflow-x-auto', lineNumbers ? 'flex-grow' : '')}>
            {tokens.map((line, idx) => (
              <CodeLine key={idx} tokens={line} twoslash={twoslashed?.get(idx)} />
            ))}
          </div>
        </code>
      </pre>
      <CodeCopyButton
        content={code.trim()}
        className="hidden group-hover:block absolute top-2 right-2"
      />
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
    <span className="block h-5">
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
