'use client'

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useTheme } from 'next-themes'
import { Highlight, Language, Prism, themes } from 'prism-react-renderer'
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'

import { copyToClipboard } from '../../lib/utils'
import { cn } from './../../lib/utils/cn'
import { Button } from './../Button'
import { dart } from './prism'

// Context for copy callback - can be provided by parent components
export const CopyCallbackContext = createContext<(() => void) | undefined>(undefined)

dart(Prism)

const prism = {
  defaultLanguage: 'js',
  plugins: ['line-numbers', 'show-language'],
}

interface SimpleCodeBlockProps {
  parentClassName?: string
  className?: string
  showCopy?: boolean
  onCopy?: () => void
  handleCopy?: (value: string) => void
}

// [Joshen] Refactor: De-dupe with CodeBlock.tsx
export const SimpleCodeBlock = ({
  children,
  parentClassName,
  className: languageClassName,
  showCopy = true,
  onCopy,
  handleCopy,
}: PropsWithChildren<SimpleCodeBlockProps>) => {
  const { resolvedTheme } = useTheme()
  const [showCopied, setShowCopied] = useState(false)
  const target = useRef(null)
  const contextOnCopy = useContext(CopyCallbackContext)
  let highlightLines: any = []

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  let language = languageClassName && languageClassName.replace(/language-/, '')

  if (!language && prism.defaultLanguage) {
    language = prism.defaultLanguage
  }

  const handleCopyCode = (code: any) => {
    if (!!handleCopy) {
      handleCopy(code)
    } else {
      copyToClipboard(code)
    }
    setShowCopied(true)
    // Use prop onCopy if provided, otherwise fall back to context
    const copyCallback = onCopy || contextOnCopy
    copyCallback?.()
  }

  return (
    <Highlight
      theme={resolvedTheme === 'dark' ? themes.nightOwl : themes.nightOwlLight}
      code={(children as string)?.trim() ?? ''}
      language={language as Language}
    >
      {({ className, tokens, getLineProps, getTokenProps }) => {
        return (
          <div className="Code codeBlockWrapper group">
            <pre ref={target} className={cn('codeBlock', className, parentClassName)}>
              {tokens.map((line, i) => {
                const { key: _key, ...lineProps } = getLineProps({ line, key: i })

                if (highlightLines.includes(i + 1)) {
                  lineProps.className = `${lineProps.className} docusaurus-highlight-code-line`
                }

                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => {
                      const { key: _key, ...tokenProps } = getTokenProps({ token, key })
                      return <span key={key} {...tokenProps} />
                    })}
                  </div>
                )
              })}
            </pre>
            {showCopy && (
              <div className="invisible absolute right-0 top-0 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                <Button size="tiny" type="default" onClick={() => handleCopyCode(children)}>
                  {showCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
          </div>
        )
      }}
    </Highlight>
  )
}
