'use client'

import { useMemo, useState } from 'react'

import { CodeTabsPanel } from './components/CodeTabsPanel'
import { ComposerFlow } from './components/ComposerFlow'
import { ComposerHeader } from './components/ComposerHeader'
import { TemplateBrowser } from './components/TemplateBrowser'
import {
  canRemoveTemplate,
  createZipBlob,
  mergeTemplates,
  resolveTemplateDependencies,
} from './lib/composer'
import { extractComposerResources } from './lib/resources'
import { getDefaultEnabledTemplateIds, type Template } from './lib/templates'
import DefaultLayout from '@/components/Layouts/Default'

interface ProjectComposerClientProps {
  templates: Template[]
}

export default function ProjectComposerClient({ templates }: ProjectComposerClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(getDefaultEnabledTemplateIds(templates))
  )
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null)
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  const resolution = useMemo(() => {
    return resolveTemplateDependencies(Array.from(selectedIds), templates)
  }, [selectedIds, templates])

  const mergeResult = useMemo(() => {
    if (resolution.resolved.length === 0) return null

    return mergeTemplates(resolution.resolved)
  }, [resolution.resolved])

  const resources = useMemo(() => {
    return extractComposerResources({ templates: resolution.resolved, mergeResult })
  }, [mergeResult, resolution.resolved])

  function addTemplate(id: string) {
    setSelectedIds((current) => new Set([...current, id]))
  }

  function removeTemplate(id: string) {
    if (!canRemoveTemplate(id, selectedIds, templates)) return

    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  async function copyCommand() {
    if (!mergeResult) return

    await navigator.clipboard.writeText(`supabase init --composition ${mergeResult.compositionId}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function downloadComposition() {
    if (!mergeResult) return

    const blob = await createZipBlob(mergeResult)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `supabase-composition-${mergeResult.compositionId}.zip`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <DefaultLayout hideHeader hideFooter className="bg-background">
      <div className="flex min-h-[720px] h-screen w-full flex-col overflow-hidden">
        <ComposerHeader
          mergeResult={mergeResult}
          copied={copied}
          onCopyCommand={copyCommand}
          onDownload={downloadComposition}
        />

        <div className="grid min-h-0 flex-1 w-full grid-cols-1 overflow-hidden lg:grid-cols-[440px_minmax(0,1fr)]">
          <div className="min-h-0">
            <TemplateBrowser
              templates={templates}
              selectedIds={selectedIds}
              resolution={resolution}
              search={search}
              onSearchChange={setSearch}
              onAddTemplate={addTemplate}
              onRemoveTemplate={removeTemplate}
              onHoverTemplate={setHoveredTemplateId}
            />
          </div>

          <section className="flex min-h-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1">
              <ComposerFlow
                templates={templates}
                resolution={resolution}
                mergeResult={mergeResult}
                resources={resources}
                hoveredTemplateId={hoveredTemplateId}
                onSelectFile={setActiveFilePath}
              />
            </div>

            <div className="h-[320px] shrink-0">
              <CodeTabsPanel
                mergeResult={mergeResult}
                activeFilePath={activeFilePath}
                onActiveFilePathChange={setActiveFilePath}
              />
            </div>
          </section>
        </div>
      </div>
    </DefaultLayout>
  )
}
