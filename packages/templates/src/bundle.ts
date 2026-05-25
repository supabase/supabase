import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  parseTemplateMetadata,
  parseTemplateRegistry,
  type ProjectComposerTemplate,
} from './schema'

interface BundleTemplateRepositoryOptions {
  rootDir: string
}

export async function bundleTemplateRepository({
  rootDir,
}: BundleTemplateRepositoryOptions): Promise<ProjectComposerTemplate[]> {
  const registry = parseTemplateRegistry(await readJsonFile(path.join(rootDir, 'registry.json')))

  return Promise.all(
    registry.templates.map((templateId) => bundleTemplateDirectory({ rootDir, templateId }))
  )
}

async function bundleTemplateDirectory({
  rootDir,
  templateId,
}: BundleTemplateRepositoryOptions & { templateId: string }): Promise<ProjectComposerTemplate> {
  const templateDir = path.join(rootDir, 'templates', templateId)
  const metadata = parseTemplateMetadata(
    await readJsonFile(path.join(templateDir, 'template.json'))
  )

  if (metadata.id !== templateId) {
    throw new Error(
      `Project composer template "${templateId}" metadata id must match its registry id`
    )
  }

  const supabaseDir = path.join(templateDir, 'supabase')
  const relativeFilePaths = await listFiles(supabaseDir)
  const files = await Promise.all(
    relativeFilePaths.map(async (relativeFilePath) => ({
      path: path.posix.join('supabase', relativeFilePath),
      content: await readFile(path.join(supabaseDir, relativeFilePath), 'utf8'),
    }))
  )

  if (files.length === 0) {
    throw new Error(`Project composer template "${templateId}" must contain at least one file`)
  }

  const readme = await readOptionalReadme(templateDir)

  return {
    ...metadata,
    files,
    ...(readme ? { readme } : {}),
  }
}

async function readOptionalReadme(templateDir: string): Promise<string | undefined> {
  const readmePath = path.join(templateDir, 'readme.md')

  try {
    await access(readmePath)
  } catch {
    return undefined
  }

  const content = (await readFile(readmePath, 'utf8')).trim()

  return content.length > 0 ? content : undefined
}

async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return (await listFiles(entryPath)).map((filePath) => path.posix.join(entry.name, filePath))
      }

      if (entry.isFile()) {
        return [entry.name]
      }

      return []
    })
  )

  return files.flat().sort((a, b) => a.localeCompare(b))
}
