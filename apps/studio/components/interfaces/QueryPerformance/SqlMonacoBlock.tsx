import Editor from '@monaco-editor/react'
import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button, cn, copyToClipboard } from 'ui'

type SqlMonacoBlockProps = {
  value?: string
  className?: string
  wrapperClassName?: string
  hideCopy?: boolean
  // Fixed height in px. Defaults to 310 to match previous CodeBlock max height
  height?: number
  // Show line numbers. Defaults to false to match previous CodeBlock
  lineNumbers?: 'on' | 'off'
}

export const SqlMonacoBlock = ({
  value,
  className,
  wrapperClassName,
  height = 310,
  lineNumbers = 'off',
  hideCopy = false,
}: SqlMonacoBlockProps) => {
  const [copied, setCopied] = useState(false)

  const content = useMemo(() => value ?? '', [value])

  const handleCopy = (value: string) => {
    setCopied(true)
    copyToClipboard(value)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div
      className={cn('group relative border rounded-md overflow-hidden w-full', wrapperClassName)}
    >
      <Editor
        theme="supabase"
        language="pgsql"
        value={content}
        height={height}
        className={className}
        wrapperProps={{
          className:
            '[&_.monaco-editor]:!bg-transparent [&_.monaco-editor-background]:!bg-transparent [&_.monaco-editor]:!outline-transparent [&_.cursor]:!hidden',
        }}
        options={{
          readOnly: true,
          domReadOnly: true,
          fontSize: 13,
          minimap: { enabled: false },
          lineNumbers,
          renderLineHighlight: 'none',
          scrollbar: { vertical: 'auto', horizontal: 'auto' },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: lineNumbers === 'off' ? 0 : 3,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          selectionHighlight: false,
          occurrencesHighlight: 'off',
          fixedOverflowWidgets: true,
          padding: { top: 12, bottom: 12 },
          tabIndex: -1,
        }}
      />

      {!hideCopy && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="default"
            className="px-1.5"
            icon={copied ? <Check /> : <Copy />}
            onClick={() => handleCopy(content)}
          >
            {copied ? 'Copied' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
