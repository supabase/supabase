'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import type { MergedFile } from '../lib/composer'

interface FilePreviewSheetProps {
  file: MergedFile | null
  onOpenChange: (open: boolean) => void
}

export function FilePreviewSheet({ file, onOpenChange }: FilePreviewSheetProps) {
  return (
    <Sheet open={Boolean(file)} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0" showClose>
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle className="font-mono text-sm">{file?.path}</SheetTitle>
          <SheetDescription>
            {file && file.sources.length > 1
              ? `Merged from ${file.sources.join(', ')}`
              : `Source ${file?.sources[0] ?? ''}`}
          </SheetDescription>
        </SheetHeader>
        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words bg-surface-75 p-5 font-mono text-xs leading-relaxed">
          {file?.content}
        </pre>
      </SheetContent>
    </Sheet>
  )
}
