'use client'

import { useState } from 'react'
import { cn } from 'ui'

interface CodeBlockTabsProps {
  files: { filename: string; darkHtml: string; lightHtml: string }[]
}

export default function CodeBlockTabs({ files }: CodeBlockTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <>
      <div className="flex border-b border-muted bg-surface-200/50">
        {files.map((file, i) => (
          <button
            key={file.filename}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              'px-5 py-3 text-xs font-mono transition-colors',
              i === activeIndex
                ? 'text-foreground border-b border-foreground -mb-px'
                : 'text-foreground-lighter hover:text-foreground-light'
            )}
          >
            {file.filename}
          </button>
        ))}
      </div>
      <div
        className="hidden dark:block px-5 py-4 sm:px-6 sm:py-5 overflow-x-auto text-[13px] leading-[1.6] [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: files[activeIndex].darkHtml }}
      />
      <div
        className="block dark:hidden px-5 py-4 sm:px-6 sm:py-5 overflow-x-auto text-[13px] leading-[1.6] [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: files[activeIndex].lightHtml }}
      />
    </>
  )
}
