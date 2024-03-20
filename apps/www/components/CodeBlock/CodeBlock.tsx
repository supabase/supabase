import { Button, IconCheck, IconCopy, IconFile, IconTerminal, cn } from 'ui'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import kotlin from 'react-syntax-highlighter/dist/cjs/languages/hljs/kotlin'
import yaml from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml'
import monokaiCustomTheme from './CodeBlock.utils'

export type LANG = 'js' | 'sql' | 'py' | 'bash' | 'ts' | 'tsx' | 'kotlin' | 'yaml'
export interface CodeBlockProps {
  lang: LANG
  startingLineNumber?: number
  hideCopy?: boolean
  showLineNumbers?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
  background?: string
}

function CodeBlock(props: CodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const firstLine = props.children ? props.children.split('\n')[0] : ''

  let filename = ''

  if (firstLine.includes('filename =')) {
    filename = firstLine.split('=')[1]
  }

  const content =
    props.children && filename ? props.children.replace(`${firstLine}\n\n`, '') : props.children

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  let lang = props.lang
    ? props.lang
    : props.className
      ? props.className.replace('language-', '')
      : 'js'
  // force jsx to be js highlighted
  if (lang === 'jsx') lang = 'js'

  SyntaxHighlighter.registerLanguage('js', js)
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)
  SyntaxHighlighter.registerLanguage('bash', bash)
  SyntaxHighlighter.registerLanguage('kotlin', kotlin)
  SyntaxHighlighter.registerLanguage('yaml', yaml)

  // const large = props.size === 'large' ? true : false
  const large = false

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="not-prose dark overflow-hidden">
      {filename && (
        <div
          className="
            bg-background
            text-muted
            flex
            h-8 w-full
            items-center

            gap-1
            rounded-tr
            rounded-tl

            border-t

            border-r
            border-l
            px-4
            font-sans
            "
        >
          {lang === 'bash' ? (
            <IconTerminal size={12} strokeWidth={2} />
          ) : (
            <IconFile size={12} strokeWidth={2} />
          )}
          <span className="text-xs">{filename ?? 'index.js'}</span>
        </div>
      )}
      <div className="relative">
        {/* @ts-ignore */}
        <SyntaxHighlighter
          language={lang}
          style={isDarkTheme ? monokaiCustomTheme.dark : monokaiCustomTheme.light}
          className={cn(
            'synthax-highlighter border border-default/15 rounded-lg',
            !filename && 'rounded-t-lg',
            'rounded-b-lg',
            props.className
          )}
          customStyle={{
            padding: props.showLineNumbers
              ? large
                ? '1.25rem 1rem'
                : '1rem 0.8rem'
              : large
                ? '1.25rem 1.5rem'
                : '1.25rem 1.5rem',
            fontSize: large ? 18 : '0.775rem',
            lineHeight: large ? 1.6 : 1.4,
          }}
          showLineNumbers={props.showLineNumbers}
          lineNumberStyle={{
            padding: '0px',
            marginRight: '21px',
            minWidth: '1.5em',
            opacity: '0.3',
            fontSize: large ? 14 : '0.75rem',
          }}
        >
          {content}
        </SyntaxHighlighter>
        {!props.hideCopy && props.children ? (
          <div className="absolute right-2 top-2">
            <CopyToClipboard text={props.children}>
              <Button
                type="text"
                icon={
                  copied ? (
                    <span className="text-brand">
                      <IconCheck strokeWidth={3} />
                    </span>
                  ) : (
                    <IconCopy />
                  )
                }
                onClick={() => handleCopy()}
                aria-label="Copy"
                className="px-1.5 py-1.5 border border-transparent hover:border-strong"
              />
            </CopyToClipboard>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CodeBlock
