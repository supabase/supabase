import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from './CodeBlock.utils'
import { Button, IconCheck, IconCopy } from '@supabase/ui'
import CopyToClipboard from 'react-copy-to-clipboard'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import { useState } from 'react'

interface Props {
  lang: 'js' | 'sql' | 'py'
  startingLineNumber?: number
  hideCopy?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
}

function CodeBlock(props: Props) {
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

  return (
    <div className="relative">
      <SyntaxHighlighter
        language={lang}
        style={monokaiCustomTheme}
        className={'code-block border-scale-600 rounded-lg border'}
        customStyle={{
          padding: 0,
          fontSize: large ? 18 : 12,
          lineHeight: large ? 1.2 : 1.2,
          borderTop: '1px solid #393939',
          background: '#181818',
        }}
        showLineNumbers={lang === 'cli' ? false : true}
        lineNumberContainerStyle={{
          paddingTop: '128px',
        }}
        lineNumberStyle={{
          minWidth: '44px',
          background: '#1e1e1e',
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
        <div className="dark absolute right-2 top-2">
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
