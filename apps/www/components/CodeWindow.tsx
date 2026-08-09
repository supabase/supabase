import React from 'react'
import { cn } from 'ui'
import CodeBlock from './CodeBlock/CodeBlock'
import type { LANG } from './CodeBlock/CodeBlock'

interface Props {
  code: any
  lang?: LANG
  className?: string
  style?: React.CSSProperties
  showLineNumbers?: boolean
}

const CodeWindow = ({ code, lang, style, className, showLineNumbers }: Props) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl shadow-lg p-2 pt-0 w-full h-full bg-alternative-200 border flex flex-col',
        className
      )}
      style={style}
    >
      <div className="w-full px-2 py-3 relative flex items-center gap-1.5 lg:gap-2">
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
      </div>
      <div className="h-full w-full rounded-lg">
        <CodeBlock lang={lang ?? 'js'} size="small" showLineNumbers={showLineNumbers}>
          {code}
        </CodeBlock>
      </div>
    </div>
  )
}

export default CodeWindow
