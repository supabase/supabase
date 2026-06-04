'use client'

import { Check, Copy } from 'lucide-react'
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  bundledLanguages,
  createHighlighter,
  type BundledLanguage,
  type HighlighterGeneric,
  type ThemedToken,
} from 'shiki'
import { cn, copyToClipboard } from 'ui'

import { getFontStyle } from '~/features/ui/CodeBlock/CodeBlock.utils'
import supabaseTheme from '~/features/ui/CodeBlock/supabase-2.json'

import { normalizeCodeLanguage } from './languageIcon'

const THEME_NAME = 'Supabase Theme'

const LANG_ALIASES: Record<string, BundledLanguage> = {
  js: 'javascript',
  jsx: 'jsx',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  bash: 'bash',
  sh: 'bash',
  shell: 'shellscript',
  sql: 'sql',
  pgsql: 'sql',
  dart: 'dart',
  kotlin: 'kotlin',
  swift: 'swift',
  csharp: 'csharp',
  cs: 'csharp',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  html: 'html',
  go: 'go',
  php: 'php',
  curl: 'bash',
  http: 'http',
}

const PRELOADED_LANGS = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'python',
  'bash',
  'shellscript',
  'sql',
  'dart',
  'kotlin',
  'swift',
  'csharp',
  'json',
  'yaml',
  'html',
  'go',
  'php',
  'http',
] as const satisfies readonly BundledLanguage[]

let highlighterPromise: Promise<HighlighterGeneric<any, any>> | undefined

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [supabaseTheme as Parameters<typeof createHighlighter>[0]['themes'][number]],
      langs: [...PRELOADED_LANGS],
    })
  }

  return highlighterPromise
}

function resolveHighlightLanguage(language: string): BundledLanguage {
  const normalized = normalizeCodeLanguage(language)
  const resolved = LANG_ALIASES[normalized]

  if (resolved && resolved in bundledLanguages) {
    return resolved
  }

  if (normalized in bundledLanguages) {
    return normalized as BundledLanguage
  }

  return 'javascript'
}

function CodeLine({ tokens }: { tokens: ThemedToken[] }) {
  return (
    <span className="block min-h-4 leading-4">
      {tokens.map((token, index) => (
        <span
          key={`${token.offset}-${index}`}
          style={{ color: token.color, ...getFontStyle(token.fontStyle || 0) }}
        >
          {token.content}
        </span>
      ))}
    </span>
  )
}

function ShikiCodeCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    copyToClipboard(content, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    })
  }, [content])

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={cn(
        'rounded-md border p-1 transition hover:bg-selection',
        copied && 'bg-selection'
      )}
    >
      {copied ? (
        <Check size={14} className="text-lighter" />
      ) : (
        <Copy size={14} className="text-lighter" />
      )}
    </button>
  )
}

function ShikiCodeBlock({
  content,
  language,
  className,
  hideCopy = false,
}: {
  content: string
  language: string
  className?: string
  hideCopy?: boolean
}) {
  const highlightLanguage = useMemo(() => resolveHighlightLanguage(language), [language])
  const [tokens, setTokens] = useState<ThemedToken[][]>([])

  useEffect(() => {
    let cancelled = false

    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return

        const loadedLang = highlighter.getLoadedLanguages().includes(highlightLanguage)
          ? highlightLanguage
          : 'javascript'

        const highlighted = highlighter.codeToTokens(content, {
          lang: loadedLang,
          theme: THEME_NAME,
        })

        setTokens(highlighted.tokens)
      })
      .catch(() => {
        if (!cancelled) {
          setTokens([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [content, highlightLanguage])

  return (
    <div
      className={cn(
        'group relative shiki not-prose overflow-hidden rounded-lg border border-default bg-200 text-xs',
        className
      )}
    >
      <pre className="overflow-auto p-3">
        <code>
          {tokens.length > 0 ? (
            tokens.map((line, index) => <CodeLine key={index} tokens={line} />)
          ) : (
            <span className="block whitespace-pre-wrap text-foreground-light">{content}</span>
          )}
        </code>
      </pre>
      {!hideCopy && (
        <div className="absolute right-2 top-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <ShikiCodeCopyButton content={content} />
        </div>
      )}
    </div>
  )
}

function getMarkdownCodeElement(children: ReactNode) {
  return Children.toArray(children).find((child): child is ReactElement<{ className?: string; children?: ReactNode }> => {
    if (!isValidElement(child)) return false

    const className = (child.props as { className?: string }).className
    return typeof className === 'string' && className.startsWith('language-')
  })
}

function AiSidebarMarkdownPre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  const codeElement = getMarkdownCodeElement(children)

  if (!isValidElement(codeElement)) {
    return (
      <pre
        {...props}
        className={cn(
          'my-4 overflow-x-auto rounded-lg border border-default bg-200 p-4 text-sm text-foreground-light',
          props.className
        )}
      >
        {children}
      </pre>
    )
  }

  const { className, children: code } = codeElement.props
  const language = className?.replace('language-', '') ?? ''
  const content = typeof code === 'string' ? code.trimEnd() : String(code ?? '').trimEnd()

  if (!language || !content) {
    return (
      <pre
        {...props}
        className={cn(
          'my-4 overflow-x-auto rounded-lg border border-default bg-200 p-4 text-sm text-foreground-light',
          props.className
        )}
      >
        {children}
      </pre>
    )
  }

  return <ShikiCodeBlock content={content} language={language} className="my-4" />
}

export { AiSidebarMarkdownPre, ShikiCodeBlock }
