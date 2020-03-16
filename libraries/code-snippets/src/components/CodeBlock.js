/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState, useRef } from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'
import defaultTheme from 'prism-react-renderer/themes/palenight'
import Clipboard from 'clipboard'
import rangeParser from 'parse-numeric-range'

const highlightLinesRangeRegex = /{([\d,-]+)}/
const prism = {
  defaultLanguage: 'js',
  plugins: ['line-numbers', 'show-language'],
}
export default ({ children, className: languageClassName, metastring }) => {
  const [showCopied, setShowCopied] = useState(false)
  const target = useRef(null)
  const button = useRef(null)
  let highlightLines = []

  if (metastring && highlightLinesRangeRegex.test(metastring)) {
    const highlightLinesRange = metastring.match(highlightLinesRangeRegex)[1]
    highlightLines = rangeParser.parse(highlightLinesRange).filter(n => n > 0)
  }

  useEffect(() => {
    let clipboard

    if (button.current) {
      clipboard = new Clipboard(button.current, {
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

  const handleCopyCode = () => {
    window.getSelection().empty()
    setShowCopied(true)

    setTimeout(() => setShowCopied(false), 2000)
  }

  return (
    <Highlight
      className=""
      {...defaultProps}
      theme={prism.theme || defaultTheme}
      code={children.trim()}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <div className="Code codeBlockWrapper">
          <pre ref={target} className={`codeBlock ${className}`} >
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
          <button
            ref={button}
            type="button"
            aria-label="Copy code to clipboard"
            className="copyButton"
            onClick={handleCopyCode}
          >
            {showCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </Highlight>
  )
}
