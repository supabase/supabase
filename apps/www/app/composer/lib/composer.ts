import JSZip from 'jszip'
import { mergeFileEntries } from 'templates'
import type { MergedFile, MergeResult } from 'templates'

import type { Template } from './templates'

export type { MergeResult, MergedFile } from 'templates'

export interface CompositionManifest {
  compositionId: string
  generatedAt: string
  templates: string[]
  files: Array<{
    path: string
    sources: string[]
  }>
  warnings: string[]
}

export interface DependencyResolution {
  resolved: Template[]
  missingDeps: string[]
}

export function getTemplatesRequiringDependency(
  dependencyId: string,
  selectedIds: Iterable<string>,
  allTemplates: Template[]
): Template[] {
  const selected = new Set(selectedIds)

  return allTemplates.filter(
    (template) =>
      selected.has(template.id) && template.dependencies?.required?.includes(dependencyId)
  )
}

export function canRemoveTemplate(
  templateId: string,
  selectedIds: Iterable<string>,
  allTemplates: Template[]
): boolean {
  return getTemplatesRequiringDependency(templateId, selectedIds, allTemplates).length === 0
}

export function generateCompositionId(templateIds: string[]): string {
  const hashInput = [...templateIds].sort().join('-')
  let hashCode = 0

  for (let i = 0; i < hashInput.length; i++) {
    hashCode = (hashCode << 5) - hashCode + hashInput.charCodeAt(i)
    hashCode &= hashCode
  }

  return Math.abs(hashCode).toString(36).padStart(6, '0')
}

export function resolveTemplateDependencies(
  selectedIds: string[],
  allTemplates: Template[]
): DependencyResolution {
  const templateMap = new Map(allTemplates.map((template) => [template.id, template]))
  const resolvedIds = new Set<string>()
  const missingDeps = new Set<string>()

  function resolve(id: string) {
    if (resolvedIds.has(id)) return

    const template = templateMap.get(id)

    if (!template) {
      missingDeps.add(id)
      return
    }

    for (const depId of template.dependencies?.required ?? []) {
      resolve(depId)
    }

    resolvedIds.add(id)
  }

  for (const id of selectedIds) {
    resolve(id)
  }

  return {
    resolved: Array.from(resolvedIds)
      .map((id) => templateMap.get(id))
      .filter((template): template is Template => Boolean(template)),
    missingDeps: Array.from(missingDeps),
  }
}

export function mergeTemplates(templates: Template[]): MergeResult {
  const fileMap = new Map<string, Array<{ content: string; templateId: string }>>()
  const warnings: string[] = []

  for (const template of templates) {
    for (const file of template.files) {
      const fileEntries = fileMap.get(file.path) ?? []
      fileEntries.push({ content: file.content, templateId: template.id })
      fileMap.set(file.path, fileEntries)
    }
  }

  const files: MergedFile[] = []

  for (const [path, fileEntries] of fileMap.entries()) {
    const sources = fileEntries.map((file) => file.templateId)

    if (fileEntries.length === 1) {
      files.push({ path, content: fileEntries[0].content, sources })
      continue
    }

    const result = mergeFileEntries({ path, files: fileEntries })
    files.push({ path, content: result.content, sources })
    warnings.push(...result.warnings)
  }

  files.sort((a, b) => a.path.localeCompare(b.path))

  return {
    files,
    compositionId: generateCompositionId(templates.map((template) => template.id)),
    warnings,
  }
}

export function createCompositionManifest(
  mergeResult: MergeResult,
  generatedAt = new Date().toISOString()
): CompositionManifest {
  return {
    compositionId: mergeResult.compositionId,
    generatedAt,
    templates: Array.from(new Set(mergeResult.files.flatMap((file) => file.sources))).sort(),
    files: mergeResult.files.map((file) => ({
      path: file.path,
      sources: file.sources,
    })),
    warnings: mergeResult.warnings,
  }
}

export async function createZipBlob(mergeResult: MergeResult): Promise<Blob> {
  const zip = new JSZip()

  for (const file of mergeResult.files) {
    zip.file(file.path, file.content)
  }

  zip.file('composition.json', JSON.stringify(createCompositionManifest(mergeResult), null, 2))

  return zip.generateAsync({ type: 'blob' })
}

export async function createTemplateZipBlob(template: Template): Promise<Blob> {
  const zip = new JSZip()

  for (const file of template.files) {
    zip.file(file.path, file.content)
  }

  return zip.generateAsync({ type: 'blob' })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadTemplateZip(template: Template): Promise<void> {
  const blob = await createTemplateZipBlob(template)
  downloadBlob(blob, `supabase-template-${template.id}.zip`)
}
