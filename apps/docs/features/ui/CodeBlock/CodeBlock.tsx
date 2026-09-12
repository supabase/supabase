import { type PropsWithChildren } from 'react'
import { bundledLanguages, type BundledLanguage } from 'shiki'
import { createTwoslasher, type ExtraFiles, type NodeHover } from 'twoslash'
import { cn } from 'ui'

import { CodeBlockControls, CodeBlockTokens, type CodeToken } from './CodeBlock.client'
import { highlightCode } from './CodeBlock.highlight'
import { getCodeBlockLabel, getTokenClassName } from './CodeBlock.utils'
import denoTypes from './types/lib.deno.d.ts.include'

const extraFiles: ExtraFiles = { 'deno.d.ts': denoTypes }

const twoslasher = createTwoslasher({
  extraFiles,
  // todo: remove once Twoslash stops using deprecated baseUrl and node10 resolution
  compilerOptions: { ignoreDeprecations: '6.0' },
})
const TWOSLASHABLE_LANGS: ReadonlyArray<string> = ['js', 'ts', 'javascript', 'typescript']

const BUNDLED_LANGUAGES = Object.keys(bundledLanguages)

export async function CodeBlock({
  className,
  lang: langSetting,
  lineNumbers = true,
  contents,
  children,
  skipTypeGeneration,
  hideControls = false,
  compact = false,
}: PropsWithChildren<{
  className?: string
  lang?: string
  lineNumbers?: boolean
  contents?: string
  skipTypeGeneration?: boolean
  hideControls?: boolean
  compact?: boolean
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

  const { tokens } = await highlightCode(code, lang)

  return (
    <div
      className={cn(
        'shiki',
        'group',
        'relative',
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
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'
        )}
        role="group"
        aria-roledescription="code block"
        aria-label={getCodeBlockLabel(lang, tokens.length)}
        tabIndex={0}
      >
        <CodeBlockTokens
          lineNumbers={lineNumbers}
          lines={tokens.map((line, lineIndex) => {
            let offset = 0
            return line.map(({ content, color, fontStyle }): CodeToken => {
              const annotations = twoslashed
                ?.get(lineIndex)
                ?.get(offset)
                ?.map(({ text, docs, tags }) => ({ text, docs, tags }))
              offset += content.length
              const className = getTokenClassName(color, fontStyle)

              return annotations ? [content, className, annotations] : [content, className]
            })
          })}
        />
      </div>
      {/* After the code so the block is named before its controls, and outside the scroller so they stay pinned */}
      {!hideControls && <CodeBlockControls content={code.trim()} />}
    </div>
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
