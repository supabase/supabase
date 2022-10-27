import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from './CodeBlock.utils'
import { Button, IconCheck, IconCopy } from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import { useState } from 'react'
import { useTheme } from '../Providers'

interface Props {
  lang: 'js' | 'sql' | 'py'
  startingLineNumber?: number
  hideCopy?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
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
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)

  // const large = props.size === 'large' ? true : false
  const large = false

  // don't show line numbers if bash == lang
  const showLineNumbers = lang !== 'bash'

  return (
    <div className="relative">
      <SyntaxHighlighter
        language={lang}
        style={monokaiTheme}
        className={`code-block  rounded-lg border p-4 ${!showLineNumbers && 'pl-6'}`}
        customStyle={{
          fontSize: large ? 18 : 12,
          lineHeight: large ? 1.4 : 1.2,
          // borderTop: '1px solid #393939',
          //background: isDarkMode ? 'bg-scale-700' : 'bg-scale-300',
          //background: isDarkMode ? '#444' : '#F1F3F5',
          // we really should support proper light mode, not just show dark in both modes
          background: isDarkMode ? '#444' : '#F1F3F5',
        }}
        showLineNumbers={showLineNumbers}
        lineNumberContainerStyle={{
          paddingTop: '128px',
        }}
        lineNumberStyle={{
          minWidth: '44px',
          background: isDarkMode ? '#444' : '#F1F3F5',
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
        {props.children?.trimEnd()}
      </SyntaxHighlighter>
      {!props.hideCopy && props.children ? (
        <div className={`${isDarkMode ?? 'dark'} absolute right-2 top-2`}>
          <CopyToClipboard text={props.children}>
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
