'use client'

import { useEffect, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import type { MergedFile, MergeResult } from '../lib/composer'
import { FileTreeSidebar } from './FileTreeSidebar'

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
  const files = useMemo(() => mergeResult?.files ?? [], [mergeResult])
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
      <section className="flex h-full flex-col border-t bg-background">
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-foreground-light">
          Select templates to preview generated files.
        </div>
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col border-t bg-background">
      <Tabs_Shadcn_
        value={activeTabValue}
        onValueChange={onActiveFilePathChange}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
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
            <FileTabTrigger key={file.path} file={file} />
          ))}
        </TabsList_Shadcn_>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {files.map((file) => (
            <TabsContent_Shadcn_
              key={file.path}
              value={file.path}
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <FilePreview file={file} />
            </TabsContent_Shadcn_>
          ))}
        </div>
      </Tabs_Shadcn_>
    </section>
  )
}

function FileTabTrigger({ file }: { file: MergedFile }) {
  return (
    <TabsTrigger_Shadcn_
      value={file.path}
      className="max-w-56 shrink-0 rounded-md border-0 border-b-0 bg-muted/25 px-2.5 py-1.5 font-mono text-xs shadow-none hover:text-foreground data-[state=active]:border-b-0 data-[state=active]:border-transparent data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      <span className="block truncate">{getFileLabel(file.path)}</span>
    </TabsTrigger_Shadcn_>
  )
}

function FilePreview({ file }: { file: MergedFile }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-background [&_code]:!bg-transparent [&_pre]:!bg-background">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <code className="truncate text-xs text-foreground-light">{file.path}</code>
        <span className="shrink-0 text-xs text-foreground-light">
          {file.sources.length} source{file.sources.length === 1 ? '' : 's'}
        </span>
      </div>
      <SyntaxHighlighter
        language={inferLanguage(file)}
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
  )
}

function getFileLabel(path: string) {
  return path.split('/').pop() || path
}

function inferLanguage(file: MergedFile) {
  const extension = file.path.split('.').pop()?.toLowerCase()

  if (extension === 'toml') return 'toml'
  if (extension === 'sql') return 'sql'
  if (extension === 'ts') return 'typescript'
  if (extension === 'tsx') return 'tsx'
  if (extension === 'js') return 'javascript'
  if (extension === 'json') return 'json'

  return 'text'
}
