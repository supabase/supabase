'use client'

import dynamic from 'next/dynamic'

const CodeBlock = dynamic(() => import('ui-patterns/CodeBlock').then((module) => module.CodeBlock))

export function TerminalCode({ command }: { command: string }) {
  return (
    <CodeBlock
      language="bash"
      hideCopy
      hideLineNumbers
      wrapLongLines
      focusable={false}
      wrapperClassName="min-w-0 max-w-none flex-1"
      className="w-full max-w-none rounded-none border-0 bg-transparent! p-0 font-mono text-xs! leading-6! text-foreground!"
    >
      {command}
    </CodeBlock>
  )
}
