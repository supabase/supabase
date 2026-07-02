import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, cn, copyToClipboard } from 'ui'

import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

type SqlMonacoBlockProps = {
  value?: string
  wrapperClassName?: string
}

export const SqlMonacoBlock = ({ value, wrapperClassName }: SqlMonacoBlockProps) => {
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
      <CodeEditor
        hideLineNumbers
        language="pgsql"
        value={content}
        className="h-[322px] pl-2"
        options={{ padding: { top: 12, bottom: 12 } }}
      />

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="default"
          className="px-1.5"
          icon={copied ? <Check /> : <Copy />}
          onClick={() => handleCopy(content)}
        >
          {copied ? 'Copied' : ''}
        </Button>
      </div>
    </div>
  )
}
