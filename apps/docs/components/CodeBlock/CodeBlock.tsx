import { FC } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from './CodeBlock.utils'
import { Button, IconCheck, IconCopy } from 'ui'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import csharp from 'react-syntax-highlighter/dist/cjs/languages/hljs/csharp'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import dart from 'react-syntax-highlighter/dist/cjs/languages/hljs/dart'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'

import { useState } from 'react'
import { useTheme } from 'common/Providers'

interface Props {
  title?: string
  language: 'js' | 'jsx' | 'sql' | 'py' | 'bash' | 'ts' | 'dart' | 'json' | 'csharp'
  linesToHighlight?: number[]
  hideCopy?: boolean
  hideLineNumbers?: boolean
  className?: string
  value?: string
  children?: string
}

const CodeBlock: FC<Props> = ({
  title,
  language,
  linesToHighlight = [],
  className,
  value,
  children,
  hideCopy = false,
  hideLineNumbers = false,
}) => {
  const { isDarkMode } = useTheme()
  const monokaiTheme = monokaiCustomTheme(isDarkMode)

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  // check the length of the string inside the <code> tag
  // if it's fewer than 70 characters, add a white-space: pre so it doesn't wrap
  const shortCodeBlockClasses =
    typeof children === 'string' && children.length < 70 ? 'short-inline-codeblock' : ''

  let lang = language ? language : className ? className.replace('language-', '') : 'js'
  // force jsx to be js highlighted
  if (lang === 'jsx') lang = 'js'
  SyntaxHighlighter.registerLanguage('js', js)
  SyntaxHighlighter.registerLanguage('ts', ts)
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)
  SyntaxHighlighter.registerLanguage('bash', bash)
  SyntaxHighlighter.registerLanguage('dart', dart)
  SyntaxHighlighter.registerLanguage('csharp', csharp)
  SyntaxHighlighter.registerLanguage('json', json)

  const large = false
  // don't show line numbers if bash == lang
  if (lang !== 'bash') hideLineNumbers = true
  const showLineNumbers = !hideLineNumbers

  return (
    <>
      {title && (
        <div className="rounded-t-md bg-scale-300 py-2 px-4 border-b border-scale-500 text-blue-1100 font-sans">
          {title.replace(/%20/g, ' ')}
        </div>
      )}
      {className ? (
        <div className="relative max-w-[90vw] md:max-w-none overflow-auto">
          <SyntaxHighlighter
            language={lang}
            wrapLines={true}
            style={monokaiTheme}
            className={[
              'code-block border p-4 w-full !my-0 !bg-scale-300',
              `${!title ? '!rounded-md' : '!rounded-t-none !rounded-b-md'}`,
              `${!showLineNumbers ? 'pl-6' : ''}`,
              className,
            ].join(' ')}
            customStyle={{
              fontSize: large ? 18 : 13,
              lineHeight: large ? 1.5 : 1.4,
            }}
            showLineNumbers={showLineNumbers}
            lineProps={(lineNumber) => {
              if (linesToHighlight.includes(lineNumber)) {
                return {
                  style: { display: 'block', backgroundColor: 'var(--colors-scale6)' },
                }
              }
              return {}
            }}
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
          {!hideCopy && (value || children) && className ? (
            <div
              className={[
                'absolute right-2',
                `${isDarkMode ? 'dark' : ''}`,
                `${!title ? 'top-2' : 'top-[3.25rem]'}`,
              ].join(' ')}
            >
              {/* // 
              @ts-ignore */}
              <CopyToClipboard text={value || children}>
                <Button
                  type="default"
                  icon={copied ? <IconCheck /> : <IconCopy />}
                  onClick={() => handleCopy()}
                >
                  {copied ? 'Copied' : ''}
                </Button>
              </CopyToClipboard>
            </div>
          ) : null}
        </div>
      ) : (
        <code className={shortCodeBlockClasses}>{value || children}</code>
      )}
    </>
  )
}

export default CodeBlock
