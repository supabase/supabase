import Editor from '@monaco-editor/react'
import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { Button, cn } from 'ui'

type JsonMonacoBlockProps = {
  value?: string
  className?: string
  wrapperClassName?: string
  hideCopy?: boolean
  // Fixed height in px
  height?: number
  // Show line numbers. Defaults to false
  lineNumbers?: 'on' | 'off'
  // Font size in px. Defaults to 11 to match details panel text scale
  fontSize?: number
}

export const JsonMonacoBlock = ({
  value,
  className,
  wrapperClassName,
  height = 220,
  lineNumbers = 'off',
  hideCopy = false,
  fontSize = 11,
}: JsonMonacoBlockProps) => {
  const [copied, setCopied] = useState(false)

  const content = useMemo(() => value ?? '', [value])

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div
      className={cn('group relative border rounded-md overflow-hidden w-full', wrapperClassName)}
    >
      <Editor
        theme="supabase"
        language="json"
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
          fontSize,
          minimap: { enabled: false },
          lineNumbers,
          renderLineHighlight: 'none',
          scrollbar: { vertical: 'auto', horizontal: 'auto' },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: lineNumbers === 'off' ? 0 : 3,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          selectionHighlight: false,
          occurrencesHighlight: 'off',
          fixedOverflowWidgets: true,
          padding: { top: 8, bottom: 8 },
          tabIndex: -1,
        }}
      />

      {!hideCopy && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyToClipboard text={content}>
            <Button
              type="default"
              className="px-1.5"
              icon={copied ? <Check /> : <Copy />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : ''}
            </Button>
          </CopyToClipboard>
        </div>
      )}
    </div>
  )
}
