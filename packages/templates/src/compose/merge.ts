import { mergeFileEntries } from '../composer/file-registry'
import type { Template } from '../schema'
import { generateCompositionId } from './composition-id'
import type { MergedFile, MergeResult } from './types'

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
