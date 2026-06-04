'use client'

import { Check, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button_Shadcn_, cn, Sheet, SheetContent, SheetSection, SheetTitle } from 'ui'

import type { Template } from '../lib/templates'
import { FileExplorerPanel } from './FileExplorerPanel'
import {
  getTemplateAddCommand,
  templateAddCliDescription,
  TemplateCliPopover,
} from './TemplateCliPopover'
import { TemplateDownloadButton } from './TemplateDownloadButton'
import { templateMarkdownComponents } from './templateMarkdownComponents'

interface TemplateDetailSheetProps {
  template: Template | null
  selectedIds: Set<string>
  resolvedIds: Set<string>
  onOpenChange: (open: boolean) => void
  onAdd: () => void
}

const templateFilesPanelHeight = 'h-80'

export function TemplateDetailSheet({
  template,
  selectedIds,
  resolvedIds,
  onOpenChange,
  onAdd,
}: TemplateDetailSheetProps) {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  const explorerFiles = useMemo(
    () =>
      template?.files.map((file) => ({
        path: file.path,
        content: file.content,
      })) ?? [],
    [template]
  )

  const isSelected = template ? selectedIds.has(template.id) : false
  const isAutoIncluded = template ? !isSelected && resolvedIds.has(template.id) : false
  const isAdded = isSelected || isAutoIncluded

  useEffect(() => {
    setActiveFilePath(null)
  }, [template?.id])

  const markdownContent = template?.readme

  return (
    <Sheet open={Boolean(template)} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0" showClose={false}>
        <div className="flex shrink-0 items-center gap-4 border-b px-5 py-3">
          {template ? (
            <>
              <div className="min-w-0 flex-1">
                <SheetTitle className="line-clamp-1 text-sm font-medium text-foreground">
                  {template.name}
                </SheetTitle>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <TemplateCliPopover
                  matchSearchInput
                  command={getTemplateAddCommand(template.id)}
                  description={templateAddCliDescription}
                />
                <TemplateDownloadButton template={template} matchSearchInput />
                {!isAdded ? (
                  <Button_Shadcn_
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Add template"
                    className="shrink-0 gap-1.5"
                    onClick={onAdd}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button_Shadcn_>
                ) : (
                  <Button_Shadcn_
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Template added"
                    className="shrink-0 gap-1.5"
                    disabled
                  >
                    <Check
                      className={cn('h-3.5 w-3.5', isAutoIncluded ? 'text-warning' : 'text-brand')}
                      strokeWidth={2}
                    />
                    Added
                  </Button_Shadcn_>
                )}
              </div>
            </>
          ) : (
            <SheetTitle className="sr-only">Template details</SheetTitle>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-b px-6 py-12">
          {markdownContent ? (
            <div className="mx-auto w-full max-w-prose">
              <div className="prose prose-docs max-w-none text-base text-foreground-light [&_pre]:m-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={templateMarkdownComponents}>
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>

        <SheetSection
          className={`flex ${templateFilesPanelHeight} shrink-0 flex-col overflow-hidden border-b bg-background p-0`}
        >
          <FileExplorerPanel
            files={explorerFiles}
            activeFilePath={activeFilePath}
            onActiveFilePathChange={setActiveFilePath}
            emptyMessage="This template has no files."
            className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row"
          />
        </SheetSection>
      </SheetContent>
    </Sheet>
  )
}
