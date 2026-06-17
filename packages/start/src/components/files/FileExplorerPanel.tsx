'use client'

import { useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { inferLanguage } from 'template-composer'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import { FileTreeSidebar } from './FileTreeSidebar'

export interface ExplorerFile {
  path: string
  content: string
  meta?: string
}

interface FileExplorerPanelProps {
  files: ExplorerFile[]
  activeFilePath: string | null
  onActiveFilePathChange: (path: string | null) => void
  emptyMessage?: string
  className?: string
}

export function FileExplorerPanel({
  files,
  activeFilePath,
  onActiveFilePathChange,
  emptyMessage = 'No files to preview.',
  className,
}: FileExplorerPanelProps) {
  const activeTabValue = activeFilePath ?? files[0]?.path ?? ''

  useEffect(() => {
    if (files.length === 0) {
      if (activeFilePath) onActiveFilePathChange(null)
      return
    }

    if (!activeFilePath || !files.some((file) => file.path === activeFilePath)) {
      onActiveFilePathChange(files[0].path)
    }
  }, [activeFilePath, files, onActiveFilePathChange])

  if (files.length === 0 || !activeTabValue) {
    return (
      <div className={className}>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-foreground-light">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <Tabs_Shadcn_
      value={activeTabValue}
      onValueChange={onActiveFilePathChange}
      className={className ?? 'flex min-h-0 flex-1 flex-col lg:flex-row'}
    >
      <div className="hidden min-h-0 shrink-0 overflow-y-auto lg:flex lg:w-64 lg:flex-col lg:border-r">
        <FileTreeSidebar
          filePaths={files.map((file) => file.path)}
          activeFilePath={activeFilePath}
          onActiveFilePathChange={onActiveFilePathChange}
        />
      </div>

      <TabsList_Shadcn_ className="h-auto shrink-0 justify-start gap-1.5 overflow-x-auto border-none bg-background px-4 pt-2 pb-0 lg:hidden">
        {files.map((file) => (
          <FileTabTrigger key={file.path} path={file.path} />
        ))}
      </TabsList_Shadcn_>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {files.map((file) => (
          <TabsContent_Shadcn_
            key={file.path}
            value={file.path}
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <ExplorerFilePreview file={file} />
          </TabsContent_Shadcn_>
        ))}
      </div>
    </Tabs_Shadcn_>
  )
}

function FileTabTrigger({ path }: { path: string }) {
  return (
    <TabsTrigger_Shadcn_
      value={path}
      className="max-w-56 shrink-0 rounded-md border-0 border-b-0 bg-muted/25 px-2.5 py-1.5 font-mono text-xs shadow-none hover:text-foreground data-[state=active]:border-b-0 data-[state=active]:border-transparent data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      <span className="block truncate">{getFileLabel(path)}</span>
    </TabsTrigger_Shadcn_>
  )
}

function ExplorerFilePreview({ file }: { file: ExplorerFile }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 py-2.5">
        <code className="truncate text-xs text-foreground-light">{file.path}</code>
        {file.meta ? (
          <span className="shrink-0 text-xs text-foreground-light">{file.meta}</span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto [&_code]:!bg-transparent [&_pre]:!bg-background">
        <SyntaxHighlighter
          language={inferLanguage(file.path)}
          style={oneDark}
          wrapLongLines
          customStyle={{
            margin: 0,
            background: 'hsl(var(--background-default))',
            padding: '16px',
            fontSize: '0.75rem',
            lineHeight: 1.6,
          }}
          codeTagProps={{ className: 'font-mono !bg-transparent' }}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function getFileLabel(path: string) {
  return path.split('/').pop() || path
}

export function toExplorerFiles(
  files: Array<{ path: string; content: string; sources?: string[] }>
): ExplorerFile[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    meta:
      file.sources && file.sources.length > 0
        ? `${file.sources.length} source${file.sources.length === 1 ? '' : 's'}`
        : undefined,
  }))
}
