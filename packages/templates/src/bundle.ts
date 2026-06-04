import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { parseCategoriesManifest, type CategoriesManifest } from './categories'
import { parseTemplateRegistry, parseTemplateSummary, type Template } from './schema'

interface BundleTemplateRepositoryOptions {
  rootDir: string
}

export interface BundledRepository {
  templates: Template[]
  categories: CategoriesManifest
}

export async function bundleTemplateRepository({
  rootDir,
}: BundleTemplateRepositoryOptions): Promise<BundledRepository> {
  const registry = parseTemplateRegistry(await readJsonFile(path.join(rootDir, 'registry.json')))

  const templates = await Promise.all(
    registry.templates.map((templateId) => bundleTemplateDirectory({ rootDir, templateId }))
  )

  const categories = parseCategoriesManifest(
    await readJsonFile(path.join(rootDir, 'categories.json'))
  )

  return { templates, categories }
}

async function bundleTemplateDirectory({
  rootDir,
  templateId,
}: BundleTemplateRepositoryOptions & { templateId: string }): Promise<Template> {
  const templateDir = path.join(rootDir, 'templates', templateId)
  const summary = parseTemplateSummary(await readJsonFile(path.join(templateDir, 'template.json')))

  if (summary.id !== templateId) {
    throw new Error(`Template "${templateId}" metadata id must match its registry id`)
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
    throw new Error(`Template "${templateId}" must contain at least one file`)
  }

  const readme = await readOptionalReadme(templateDir)

  return {
    ...summary,
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
