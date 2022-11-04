import { FC } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from './CodeBlock.utils'
import { Button, IconCheck, IconCopy } from 'ui'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import dart from 'react-syntax-highlighter/dist/cjs/languages/hljs/dart'

import { useState } from 'react'
import { useTheme } from '../Providers'

interface Props {
  title?: string
  language: 'js' | 'jsx' | 'sql' | 'py' | 'bash' | 'ts' | 'dart'
  hideCopy?: boolean
  hideLineNumbers?: boolean
  className?: string
  value?: string
  children?: string
}

const CodeBlock: FC<Props> = ({
  title,
  language,
  className,
  value,
  children,
  hideCopy = false,
  hideLineNumbers = false,
}) => {
  console.log('CodeBlock', { title })
  const { isDarkMode } = useTheme()
  const monokaiTheme = monokaiCustomTheme(isDarkMode)

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  let xxxlang = language ? language : className ? className.replace('language-', '') : 'js'
  // force jsx to be js highlighted
  if (xxxlang === 'jsx') xxxlang = 'js'
  SyntaxHighlighter.registerLanguage('js', js)
  SyntaxHighlighter.registerLanguage('ts', ts)
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)
  SyntaxHighlighter.registerLanguage('bash', bash)
  SyntaxHighlighter.registerLanguage('dart', dart)

  // const large = props.size === 'large' ? true : false
  const large = false

  // don't show line numbers if bash == lang
  const showLineNumbers = hideLineNumbers || xxxlang !== 'bash'

  return (
    <div className="relative my-2">
      {title && (
        <div className="rounded-t-md bg-scale-300 py-2 px-4 border-b border-scale-500 text-blue-1100">
          {title}
        </div>
      )}
      {className ? (
        <SyntaxHighlighter
          language={xxxlang}
          wrapLines={true}
          style={monokaiTheme}
          className={[
            'code-block border p-4 w-full !my-0 !bg-scale-300',
            `${!title ? '!rounded-md' : '!rounded-t-none !rounded-b-md'}`,
            `${!showLineNumbers ? 'pl-6' : ''}`,
          ].join(' ')}
          customStyle={{
            fontSize: large ? 18 : 13,
            lineHeight: large ? 1.5 : 1.4,
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
          {(value || children)?.trimEnd()}
        </SyntaxHighlighter>
      ) : (
        <code>{value || children}</code>
      )}
      {!hideCopy && (value || children) && className ? (
        <div
          className={[
            'absolute right-2',
            `${isDarkMode ? 'dark' : ''}`,
            `${!title ? 'top-2' : 'top-[3.25rem]'}`,
          ].join(' ')}
        >
          <CopyToClipboard text={value || children}>
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
