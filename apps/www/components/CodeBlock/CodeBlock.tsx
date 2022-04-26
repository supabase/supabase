import { useCallback, useMemo } from 'react'
import reactSyntaxHighlighter, { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import monokaiCustomTheme from 'data/CodeEditorTheme'
import CodeBlockStyles from './CodeBlock.module.css'
import { Button, IconCopy } from '@supabase/ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import rangeParser from 'parse-numeric-range'

import classNames from 'classnames'

import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'

export interface CodeBlockProps {
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
  hideBorder?: boolean
}

function CodeBlock(props: CodeBlockProps) {
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

      return {
        class: classNames(
          CodeBlockStyles['code-line'],
          shouldHighlightLines && shouldHighlightLine && CodeBlockStyles['code-line--flash']
        ),
        style,
      }
    },
    [highlightLines]
  )

  return (
    <div className="relative">
      <SyntaxHighlighter
        language={lang}
        style={monokaiCustomTheme}
        className={[
          CodeBlockStyles['code-block'],
          '!bg-scale-1200 dark:!bg-scale-100',
          props.hideBorder ? '' : 'border-scale-1100 dark:border-scale-400 rounded-lg border',
        ].join(' ')}
        customStyle={{
          padding: 0,
          fontSize: large ? 18 : 12,
          lineHeight: large ? 1.2 : 1.2,

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
          // background: 'var(--colors-fixed-scale12)',
          paddingLeft: '21px',
          marginRight: '12px',
          color: 'var(--colors-fixed-scale7)',
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
        <div className="dark absolute right-2 top-2">
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
