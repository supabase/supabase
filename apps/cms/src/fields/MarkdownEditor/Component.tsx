'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useField } from '@payloadcms/ui'
import Prism from 'prismjs'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import './styles.css'

type MarkdownEditorProps = {
  path: string
  label?: string
  required?: boolean
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ path, label, required }) => {
  const { value, setValue } = useField<string>({ path })
  const highlightRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  // Memoized highlighted HTML - only re-compute when value changes
  const highlightedCode = useMemo(() => {
    if (!value) return ''

    // Use Prism.highlight for direct string-to-HTML conversion (faster than highlightElement)
    try {
      const grammar = Prism.languages.markdown
      if (!grammar) {
        console.warn('Markdown grammar not loaded')
        return value
      }
      return Prism.highlight(value, grammar, 'markdown')
    } catch (error) {
      console.error('Syntax highlighting error:', error)
      return value
    }
  }, [value])

  // Apply highlighted HTML to DOM only when it changes
  useEffect(() => {
    if (highlightRef.current && highlightedCode) {
      highlightRef.current.innerHTML = highlightedCode
    }
  }, [highlightedCode])

  return (
    <div className="markdown-editor-field">
      <div className="markdown-editor-container">
        <pre className="markdown-editor-highlight" aria-hidden="true" suppressHydrationWarning>
          <code ref={highlightRef} className="language-markdown" />
        </pre>

        <textarea
          ref={textareaRef}
          className="markdown-editor-textarea"
          value={value || ''}
          onChange={handleChange}
          placeholder="Write your markdown content here..."
          rows={20}
          spellCheck="false"
        />
      </div>
    </div>
  )
}

export const Label = ({ label, required }: { label: string; required?: boolean }) => {
  return (
    <label>
      {label}
      {required && <span className="required">*</span>}
    </label>
  )
}
