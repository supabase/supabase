'use client'

import { useMemo } from 'react'

import type { MergeResult } from '../lib/composer'
import { FileExplorerPanel, toExplorerFiles } from './FileExplorerPanel'

interface CodeTabsPanelProps {
  mergeResult: MergeResult | null
  activeFilePath: string | null
  onActiveFilePathChange: (path: string | null) => void
}

export function CodeTabsPanel({
  mergeResult,
  activeFilePath,
  onActiveFilePathChange,
}: CodeTabsPanelProps) {
  const files = useMemo(() => toExplorerFiles(mergeResult?.files ?? []), [mergeResult])

  if (files.length === 0) {
    return (
      <section className="flex h-full flex-col border-t bg-background">
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-foreground-light">
          Select templates to preview generated files.
        </div>
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col border-t bg-background">
      <FileExplorerPanel
        files={files}
        activeFilePath={activeFilePath}
        onActiveFilePathChange={onActiveFilePathChange}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      />
    </section>
  )
}
