import { useCallback, useMemo } from 'react'
import reactSyntaxHighlighter, { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from 'data/CodeEditorTheme'
import CodeBlockStyles from './CodeBlock.module.css'
import { Button, IconCopy } from '@supabase/ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import rangeParser from 'parse-numeric-range'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'

interface Props {
  lang: 'js' | 'ts' | 'sql' | 'py'
  startingLineNumber?: number
  hideCopy?: boolean
  className?: string
  children?: string
  size?: 'small' | 'medium' | 'large'
  /**
   * Inline styling
   * Supports CSS Properties in camelcase
   */
  style?: React.CSSProperties | undefined
  /**
   * Lines to be highlighted.
   * Supports individual lines: '14', multiple lines: '14,15', or a range of lines '14..19'
   */
  highlightLines?: string
  /**
   * Shows an application toolbar at the top
   */
  showToolbar?: boolean
}

function CodeBlock(props: Props) {
  let lang = props.lang
    ? props.lang
    : props.className
    ? props.className.replace('language-', '')
    : 'js'
  // force jsx to be js highlighted
  if (lang === 'jsx') lang = 'js'
  if (lang === 'tsx') lang = 'ts'

  SyntaxHighlighter.registerLanguage('js', js)
  SyntaxHighlighter.registerLanguage('ts', ts)
  SyntaxHighlighter.registerLanguage('py', py)
  SyntaxHighlighter.registerLanguage('sql', sql)

  // const large = props.size === 'large' ? true : false
  const large = false

  const shouldHighlightLines = props.highlightLines !== undefined
  const highlightLines = useMemo(
    () => new Set(rangeParser(props.highlightLines ?? '')),
    [props.highlightLines]
  )

  const lineProps = useCallback(
    (lineNumber: number) => {
      const shouldHighlightLine = !shouldHighlightLines || highlightLines.has(lineNumber)

      const style = shouldHighlightLine ? {} : { filter: 'grayscale(75%)', opacity: 0.5 }

      return { class: CodeBlockStyles['code-line'], style }
    },
    [highlightLines]
  )

  return (
    <div className="relative">
      {props.showToolbar && (
        <div className="bg-scale-200 border border-b-0 h-7 w-full rounded-t-lg flex gap-1.5 items-center px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-scale-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-scale-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-scale-400 rounded-full"></div>
          </div>
          {/* <span className="text-scale-900 font-mono text-xs">hello.tsx</span> */}
        </div>
      )}
      <SyntaxHighlighter
        language={lang}
        style={monokaiCustomTheme}
        className={[
          CodeBlockStyles['code-block'],
          props.showToolbar ? CodeBlockStyles['code-block--show-toolbar'] : '',
        ].join(' ')}
        customStyle={{
          padding: 0,
          fontSize: large ? 18 : 12,
          lineHeight: large ? 1.2 : 1.2,
          background: 'var(--colors-gray1)',
          ...props.style,
        }}
        showLineNumbers={lang === 'cli' ? false : true}
        lineNumberContainerStyle={{
          paddingTop: '128px',
        }}
        lineNumberStyle={{
          display: 'inline-flex',
          justifyContent: 'flex-end',
          minWidth: '48px',
          background: 'var(--colors-scale1)',
          paddingLeft: '21px',
          marginRight: '12px',
          color: 'var(--colors-scale8)',
          fontSize: large ? 14 : 12,
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
        wrapLines={true}
        lineProps={lineProps}
      >
        {props.children}
      </SyntaxHighlighter>

      {!props.hideCopy && props.children ? (
        <div className="absolute right-2 top-2 dark">
          <CopyToClipboard text={props.children}>
            <Button type="default" icon={<IconCopy />}>
              Copy
            </Button>
          </CopyToClipboard>
        </div>
      ) : null}
    </div>
  )
}

export default CodeBlock
