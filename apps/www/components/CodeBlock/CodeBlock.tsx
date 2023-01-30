import { Button, IconCheck, IconCopy, IconFile, IconTerminal } from 'ui'
import { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import monokaiCustomTheme from './CodeBlock.utils'

export interface CodeBlockProps {
  lang: 'js' | 'sql' | 'py' | 'bash' | 'ts' | 'tsx'
  startingLineNumber?: number
  hideCopy?: boolean
  showLineNumbers?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
}

function CodeBlock(props: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

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

  // const large = props.size === 'large' ? true : false
  const large = false

  return (
    <div className="not-prose dark overflow-hidden">
      {filename && (
        <div
          className="
            bg-scale-200
            text-scale-900
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
        <SyntaxHighlighter
          language={lang}
          style={monokaiCustomTheme}
          className={[!filename && 'rounded-t-lg', 'rounded-b-lg'].join(' ')}
          customStyle={{
            padding: '21px 24px',
            fontSize: large ? 18 : '0.875rem',
            lineHeight: large ? 1.6 : 1.4,
            background: '#181818',
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
          <div className="dark absolute right-2 top-2">
            <CopyToClipboard text={props.children}>
              <Button
                type="text"
                icon={
                  copied ? (
                    <span className="text-brand-900">
                      <IconCheck strokeWidth={3} />
                    </span>
                  ) : (
                    <IconCopy />
                  )
                }
                onClick={() => handleCopy()}
              >
                {/* {copied ? 'Copied' : 'Copy'} */}
              </Button>
            </CopyToClipboard>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CodeBlock
