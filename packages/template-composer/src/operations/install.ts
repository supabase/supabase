import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Template, TemplateFile } from '../schema'

export interface InstallTemplateOptions {
  template: Template
  targetDir: string
  /** When false (default), aborts before overwriting any file that already exists on disk. */
  overwrite?: boolean
  /** Strips a leading path segment from each file before writing. */
  stripPrefix?: string
}

export interface InstallResult {
  written: string[]
  skipped: string[]
}

/**
 * CLI-side primitive: writes a single template's files into a target directory.
 * Used by `supabase templates add <id>`. Composer doesn't use this — it merges
 * many templates into an in-memory result instead.
 */
export async function installTemplate({
  template,
  targetDir,
  overwrite = false,
  stripPrefix,
}: InstallTemplateOptions): Promise<InstallResult> {
  const { existsSync } = await import('node:fs')

  const written: string[] = []
  const skipped: string[] = []

  const targets = template.files.map((file) => ({
    file,
    targetPath: path.join(targetDir, stripFilePrefix(file.path, stripPrefix)),
  }))

  if (!overwrite) {
    const conflicts = targets.filter(({ targetPath }) => existsSync(targetPath))
    if (conflicts.length > 0) {
      throw new Error(
        `Refusing to overwrite existing files (pass overwrite: true to allow): ${conflicts
          .map((c) => c.targetPath)
          .join(', ')}`
      )
    }
  }

  for (const { file, targetPath } of targets) {
    await mkdir(path.dirname(targetPath), { recursive: true })
    await writeFile(targetPath, file.content, 'utf8')
    written.push(targetPath)
  }

  return { written, skipped }
}

function stripFilePrefix(filePath: string, prefix: string | undefined): string {
  if (!prefix) return filePath
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`
  return filePath.startsWith(normalized) ? filePath.slice(normalized.length) : filePath
}

export type { Template, TemplateFile }
