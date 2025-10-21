'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useField } from '@payloadcms/ui'
import Prism from 'prismjs'
import 'prismjs/components/prism-markdown'
import './styles.css'

type MarkdownEditorProps = {
  path: string
  label?: string
  required?: boolean
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ path, label, required }) => {
  const { value, setValue } = useField<string>({ path })
  const highlightRef = useRef<HTMLPreElement>(null)
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

  // Highlight using Prism
  useEffect(() => {
    if (highlightRef.current) {
      Prism.highlightElement(highlightRef.current)
    }
  }, [value])

  return (
    <div className="markdown-editor-field">
      <div className="field-label">
        {label && (
          <label>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
      </div>
      <div className="markdown-editor-container">
        <pre className="markdown-editor-highlight" aria-hidden="true">
          <code ref={highlightRef} className="language-markdown">
            {value || ''}
          </code>
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
