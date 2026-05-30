'use client'

import React from 'react'

type CodeDisplayProps = {
  code: string
  title?: string
}

export default function CodeDisplay({ code, title = 'Code' }: CodeDisplayProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-neutral-900 border-b border-neutral-700/50 text-neutral-400 text-xs py-2 px-4">
        {title}
      </div>
      <div className="bg-neutral-900 p-4 overflow-auto flex-1">
        <pre className="text-xs text-neutral-300 overflow-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
