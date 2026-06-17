import type { CompositionManifest, MergeResult } from './types'

export function generateCompositionId(templateIds: string[]): string {
  const hashInput = [...templateIds].sort().join('-')
  let hashCode = 0

  for (let i = 0; i < hashInput.length; i++) {
    hashCode = (hashCode << 5) - hashCode + hashInput.charCodeAt(i)
    hashCode &= hashCode
  }

  return Math.abs(hashCode).toString(36).padStart(6, '0')
}

export function createCompositionManifest(
  mergeResult: MergeResult,
  generatedAt: string = new Date().toISOString()
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
