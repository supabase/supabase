/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Clipboard from 'clipboard'
import rangeParser from 'parse-numeric-range'
import Highlight, { Language, defaultProps } from 'prism-react-renderer'
import defaultTheme from 'prism-react-renderer/themes/palenight'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Button } from 'ui'

import { copyToClipboard } from 'lib/helpers'

const highlightLinesRangeRegex = /{([\d,-]+)}/
const prism = {
  defaultLanguage: 'js',
  plugins: ['line-numbers', 'show-language'],
}

interface SimpleCodeBlockProps {
  className?: string
  metastring?: string
}

const SimpleCodeBlock = ({
  children,
  className: languageClassName,
  metastring,
}: PropsWithChildren<SimpleCodeBlockProps>) => {
  const [showCopied, setShowCopied] = useState(false)
  const target = useRef(null)
  const button = useRef(null)
  let highlightLines: any = []

  if (metastring && highlightLinesRangeRegex.test(metastring)) {
    const highlightLinesRange = metastring.match(highlightLinesRangeRegex)?.[1]
    if (highlightLinesRange) highlightLines = rangeParser(highlightLinesRange).filter((n) => n > 0)
  }

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  useEffect(() => {
    let clipboard: any

    // @ts-ignore
    if (button?.current?.button) {
      // @ts-ignore
      clipboard = new Clipboard(button.current.button, {
        // @ts-ignore
        target: () => target.current,
      })
    }

    return () => {
      if (clipboard) {
        clipboard.destroy()
      }
    }
  }, [button.current, target.current])

  let language = languageClassName && languageClassName.replace(/language-/, '')

  if (!language && prism.defaultLanguage) {
    language = prism.defaultLanguage
  }

  const handleCopyCode = (code: any) => {
    copyToClipboard(code, () => setShowCopied(true))
  }

  return (
    <Highlight
      {...defaultProps}
      theme={(prism as any).theme || defaultTheme}
      code={(children as string)?.trim() ?? ''}
      language={language as Language}
    >
      {({ className, tokens, getLineProps, getTokenProps }) => {
        return (
          <div className="Code codeBlockWrapper group">
            <pre ref={target} className={`codeBlock ${className}`}>
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i })

                if (highlightLines.includes(i + 1)) {
                  lineProps.className = `${lineProps.className} docusaurus-highlight-code-line`
                }

                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                )
              })}
            </pre>
            <div className="invisible absolute right-0 top-0 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
              <Button size="tiny" type="default" onClick={() => handleCopyCode(children)}>
                {showCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )
      }}
    </Highlight>
  )
}

export default SimpleCodeBlock
