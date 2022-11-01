import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from './CodeBlock.utils'
import { Button, IconCheck, IconCopy } from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import dart from 'react-syntax-highlighter/dist/cjs/languages/hljs/dart'

import { useState } from 'react'
import { useTheme } from '../Providers'

interface Props {
  lang: 'js' | 'jsx' | 'sql' | 'py' | 'bash' | 'ts' | 'dart'
  startingLineNumber?: number
  hideCopy?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
  value?: string
}

function CodeBlock(props: Props) {
  const { isDarkMode } = useTheme()
  const monokaiTheme = monokaiCustomTheme(isDarkMode)

  const [copied, setCopied] = useState(false)

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
  SyntaxHighlighter.registerLanguage('ts', ts)
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)
  SyntaxHighlighter.registerLanguage('bash', bash)
  SyntaxHighlighter.registerLanguage('dart', dart)

  // const large = props.size === 'large' ? true : false
  const large = false

  // don't show line numbers if bash == lang
  const showLineNumbers = lang !== 'bash'

  return (
    <div className="relative">
      {props.className ? (
        <SyntaxHighlighter
          language={lang}
          style={monokaiTheme}
          className={`code-block rounded-lg border p-4 !my-2 !bg-scale-400 ${
            !showLineNumbers && 'pl-6'
          }`}
          customStyle={{
            fontSize: large ? 18 : 12,
            lineHeight: large ? 1.4 : 1.2,
          }}
          showLineNumbers={showLineNumbers}
          lineNumberContainerStyle={{
            paddingTop: '128px',
          }}
          lineNumberStyle={{
            minWidth: '44px',
            paddingLeft: '4px',
            paddingRight: '4px',
            marginRight: '12px',
            color: '#828282',
            textAlign: 'center',
            fontSize: large ? 14 : 12,
            paddingTop: '4px',
            paddingBottom: '4px',
          }}
        >
          {(props.value || props.children)?.trimEnd()}
        </SyntaxHighlighter>
      ) : (
        <code>{props.value || props.children}</code>
      )}
      {!props.hideCopy && (props.value || props.children) && props.className ? (
        <div className={`${isDarkMode ?? 'dark'} absolute right-2 top-2`}>
          <CopyToClipboard text={props.value || props.children}>
            <Button
              type="default"
              icon={copied ? <IconCheck /> : <IconCopy />}
              onClick={() => handleCopy()}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </CopyToClipboard>
        </div>
      ) : null}
    </div>
  )
}

export default CodeBlock
