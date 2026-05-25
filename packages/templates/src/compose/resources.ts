import { extractFromFile } from '../composer/file-registry'
import type { ComposerResource } from '../composer/types'
import type { Template } from '../schema'
import type { MergeResult } from './types'

export function extractComposerResources({
  templates,
  mergeResult,
}: {
  templates: Template[]
  mergeResult: MergeResult | null
}): ComposerResource[] {
  const mergedFilePaths = new Set(mergeResult?.files.map((file) => file.path) ?? [])
  const resources = new Map<string, ComposerResource>()

  for (const template of templates) {
    for (const file of template.files) {
      if (mergedFilePaths.size > 0 && !mergedFilePaths.has(file.path)) continue

      for (const candidate of extractFromFile({
        path: file.path,
        content: file.content,
        templateId: template.id,
      })) {
        const existing = resources.get(candidate.id)

        if (existing) {
          existing.sourceTemplateIds = Array.from(
            new Set([...existing.sourceTemplateIds, candidate.sourceTemplateId])
          ).sort()
          continue
        }

        const { sourceTemplateId, ...rest } = candidate
        resources.set(candidate.id, {
          ...rest,
          sourceTemplateIds: [sourceTemplateId],
        })
      }
    }
  }

  return Array.from(resources.values()).sort((a, b) => {
    const kindComparison = a.kind.localeCompare(b.kind)
    if (kindComparison !== 0) return kindComparison

    return a.id.localeCompare(b.id)
  })
}
