import JSZip from 'jszip'
import { createCompositionManifest, type MergeResult, type Template } from 'template-composer'

export type {
  CompositionManifest,
  DependencyResolution,
  MergeResult,
  MergedFile,
} from 'template-composer'

export {
  canRemoveTemplate,
  createCompositionManifest,
  generateCompositionId,
  getTemplatesRequiringDependency,
  mergeTemplates,
  resolveTemplateDependencies,
} from 'template-composer'

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
