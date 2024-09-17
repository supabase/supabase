'use client'

import { Check, Copy } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Children, ReactNode, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Light as SyntaxHighlighter, SyntaxHighlighterProps } from 'react-syntax-highlighter'
import { cn } from '../../lib/utils/cn'
import { Button } from '../Button/Button'
import { monokaiCustomTheme } from './CodeBlock.utils'

import curl from 'highlightjs-curl'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import csharp from 'react-syntax-highlighter/dist/cjs/languages/hljs/csharp'
import dart from 'react-syntax-highlighter/dist/cjs/languages/hljs/dart'
import http from 'react-syntax-highlighter/dist/cjs/languages/hljs/http'
import js from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import kotlin from 'react-syntax-highlighter/dist/cjs/languages/hljs/kotlin'
import py from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import ts from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'

export interface CodeBlockProps {
  title?: ReactNode
  language?:
    | 'js'
    | 'jsx'
    | 'sql'
    | 'py'
    | 'bash'
    | 'ts'
    | 'dart'
    | 'json'
    | 'csharp'
    | 'kotlin'
    | 'curl'
    | 'http'
  linesToHighlight?: number[]
  highlightBorder?: boolean
  styleConfig?: {
    lineNumber?: string
    highlightBackgroundColor?: string
    highlightBorderColor?: string
  }
  hideCopy?: boolean
  hideLineNumbers?: boolean
  className?: string
  wrapperClassName?: string
  value?: string
  theme?: any
  children?: string
  renderer?: SyntaxHighlighterProps['renderer']
  focusable?: boolean
}

/**
 * CodeBlock component for displaying syntax-highlighted code.
 * @param {ReactNode} [props.title] - Optional title for the code block.
 * @param {string} [props.language] - The programming language of the code.
 * @param {number[]} [props.linesToHighlight=[]] - Array of line numbers to highlight.
 * @param {boolean} [props.highlightBorder] - Whether to show a border on highlighted lines.
 * @param {Object} [props.styleConfig] - Custom style configurations.
 * @param {string} [props.className] - Additional CSS classes for the code block.
 * @param {string} [props.wrapperClassName] - CSS classes for the wrapper div.
 * @param {string} [props.value] - The code content as a string.
 * @param {any} [props.theme] - Custom theme for syntax highlighting.
 * @param {string} [props.children] - The code content as children.
 * @param {boolean} [props.hideCopy=false] - Whether to hide the copy button.
 * @param {boolean} [props.hideLineNumbers=false] - Whether to hide line numbers.
 * @param {SyntaxHighlighterProps['renderer']} [props.renderer] - Custom renderer for syntax highlighting.
 * @param {boolean} [props.focusable=true] - Whether the code block is focusable. When true, users can focus the code block to select text or use ⌘A (Cmd+A) to select all. This is so we don't need to load Monaco Editor.
 */
export const CodeBlock = ({
  title,
  language,
  linesToHighlight = [],
  highlightBorder,
  styleConfig,
  className,
  wrapperClassName,
  value,
  theme,
  children,
  hideCopy = false,
  hideLineNumbers = false,
  renderer,
  focusable = true,
}: CodeBlockProps) => {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const monokaiTheme = theme ?? monokaiCustomTheme(isDarkTheme)

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  // Extract string when `children` has a single string node
  const childrenArray = Children.toArray(children)
  const [singleChild] = childrenArray.length === 1 ? childrenArray : []
  const singleString = typeof singleChild === 'string' ? singleChild : undefined

  let codeValue = value ?? singleString ?? children
  codeValue = codeValue?.trimEnd?.() ?? codeValue

  // check the length of the string inside the <code> tag
  // if it's fewer than 70 characters, add a white-space: pre so it doesn't wrap
  const shortCodeBlockClasses =
    typeof codeValue === 'string' && codeValue.length < 70 ? 'short-inline-codeblock' : ''

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
  SyntaxHighlighter.registerLanguage('kotlin', kotlin)
  SyntaxHighlighter.registerLanguage('curl', curl)
  SyntaxHighlighter.registerLanguage('http', http)

  const large = false
  // don't show line numbers if bash == lang
  if (lang === 'bash' || lang === 'sh') hideLineNumbers = true
  const showLineNumbers = !hideLineNumbers

  return (
    <>
      {title && (
        <div className="text-sm rounded-t-md bg-surface-100 py-2 px-4 border border-b-0 border-default font-sans">
          {title}
        </div>
      )}
      {className ? (
        <div
          className={cn(
            'group relative max-w-[90vw] md:max-w-none overflow-auto',
            wrapperClassName
          )}
        >
          {/* @ts-ignore */}
          <SyntaxHighlighter
            language={lang}
            wrapLines={true}
            // @ts-ignore
            style={monokaiTheme}
            className={cn(
              'code-block border border-surface p-4 w-full !my-0 !bg-surface-100 outline-none focus:border-foreground-lighter/50',
              `${!title ? '!rounded-md' : '!rounded-t-none !rounded-b-md'}`,
              `${!showLineNumbers ? 'pl-6' : ''}`,
              className
            )}
            customStyle={{
              fontSize: large ? 18 : 13,
              lineHeight: large ? 1.5 : 1.4,
            }}
            showLineNumbers={showLineNumbers}
            lineProps={(lineNumber) => {
              if (linesToHighlight.includes(lineNumber)) {
                return {
                  style: {
                    display: 'block',
                    backgroundColor: styleConfig?.highlightBackgroundColor
                      ? styleConfig?.highlightBackgroundColor
                      : 'hsl(var(--background-selection))',
                    borderLeft: highlightBorder
                      ? `1px solid ${styleConfig?.highlightBorderColor ? styleConfig?.highlightBorderColor : 'hsl(var(--foreground-default)'})`
                      : null,
                  },
                  class: 'hljs-line-highlight',
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
              color: styleConfig?.lineNumber ?? '#828282',
              textAlign: 'center',
              fontSize: large ? 14 : 12,
              paddingTop: '4px',
              paddingBottom: '4px',
            }}
            renderer={renderer}
            contentEditable={focusable}
            onBeforeInput={(e: any) => {
              e.preventDefault()
              return false
            }}
            suppressContentEditableWarning={true}
          >
            {codeValue}
          </SyntaxHighlighter>
          {!hideCopy && (value || children) && className ? (
            <div
              className={[
                'absolute right-2 top-2',
                'opacity-0 group-hover:opacity-100 transition',
                `${isDarkTheme ? 'dark' : ''}`,
              ].join(' ')}
            >
              {/* //
              @ts-ignore */}
              <CopyToClipboard text={value || children}>
                <Button
                  type="default"
                  className="px-1.5"
                  icon={copied ? <Check /> : <Copy />}
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
