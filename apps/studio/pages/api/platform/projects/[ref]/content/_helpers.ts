import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const SNIPPETS_DIR = path.join(process.cwd(), '../..', 'supabase', 'snippets')

export const SnippetSchema = z.object({
  id: z.string(),
  inserted_at: z.string().default(new Date().toISOString()),
  updated_at: z.string().default(new Date().toISOString()),
  type: z.literal('sql'),
  name: z.string(),
  description: z.string().optional(),
  content: z.object({
    sql: z.string(),
    favorite: z.boolean(),
    content_id: z.string(),
    schema_version: z.literal('1.0'),
  }),
  visibility: z.union([
    z.literal('user'),
    z.literal('project'),
    z.literal('org'),
    z.literal('public'),
  ]),
  project_id: z.number().nullable().default(1),
  folder_id: z.string().nullable().default(null),
  owner_id: z.number(),
  owner: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .default({ id: 1, username: 'system' }),
  updated_by: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .default({ id: 1, username: 'system' }),
})

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.number(),
  parent_id: z.string().nullable(),
  project_id: z.number(),
})

export type Snippet = z.infer<typeof SnippetSchema>
export type Folder = z.infer<typeof FolderSchema>

/**
 * Ensures the snippets directory exists
 */
export async function ensureSnippetsDirectory() {
  await fs.mkdir(SNIPPETS_DIR, { recursive: true })

  const foldersPath = path.join(SNIPPETS_DIR, 'folders.json')
  try {
    await fs.access(foldersPath)
  } catch {
    await fs.writeFile(foldersPath, JSON.stringify([], null, 2))
  }
}

/**
 * Reads all snippets from the filesystem
 */
export async function readAllSnippets(): Promise<Snippet[]> {
  await ensureSnippetsDirectory()
  const files = await fs.readdir(SNIPPETS_DIR)

  const snippets = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const content = await fs.readFile(path.join(SNIPPETS_DIR, file), 'utf-8')
        return JSON.parse(content) as Snippet
      })
  )

  return snippets
}

/**
 * Filters snippets based on favorite status
 */
export function filterSnippetsByFavorite(snippets: Snippet[], favorite?: boolean) {
  if (favorite === undefined) return snippets
  return snippets.filter((snippet) => snippet.content.favorite === favorite)
}

/**
 * Saves a snippet to the filesystem
 */
export async function saveSnippet(snippet: Snippet, projectRef: string): Promise<Snippet> {
  await ensureSnippetsDirectory()

  const snippetWithMetadata: Snippet = {
    ...snippet,
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: {
      id: snippet.owner_id,
      username: 'system', // This should be replaced with actual user info
    },
    project_id: parseInt(projectRef),
    updated_by: {
      id: snippet.owner_id,
      username: 'system', // This should be replaced with actual user info
    },
  }

  const filePath = path.join(SNIPPETS_DIR, `${snippet.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(snippetWithMetadata, null, 2))

  return snippetWithMetadata
}

/**
 * Deletes a snippet from the filesystem
 */
export async function deleteSnippet(id: string): Promise<void> {
  const filePath = path.join(SNIPPETS_DIR, `${id}.json`)
  try {
    await fs.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

/**
 * Updates a snippet in the filesystem
 */
export async function updateSnippet(
  id: string,
  updates: Partial<Snippet>,
  projectRef: string
): Promise<Snippet> {
  const filePath = path.join(SNIPPETS_DIR, `${id}.json`)

  try {
    const existingContent = await fs.readFile(filePath, 'utf-8')
    const existingSnippet = JSON.parse(existingContent) as Snippet

    const updatedSnippet: Snippet = {
      ...existingSnippet,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(filePath, JSON.stringify(updatedSnippet, null, 2))
    return updatedSnippet
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Snippet with id ${id} not found`)
    }
    throw error
  }
}

/**
 * Reads all snippets from the filesystem
 */
export async function readFolders(): Promise<Folder[]> {
  await ensureSnippetsDirectory()

  const content = await fs.readFile(path.join(SNIPPETS_DIR, 'folders.json'), 'utf-8')
  return JSON.parse(content) as Folder[]
}

/**
 * Creates a new folder and saves it to folders.json
 */
export async function createFolder(folder: Omit<Folder, 'id'>): Promise<Folder> {
  await ensureSnippetsDirectory()

  const folders = await readFolders()
  const newFolder: Folder = { ...folder, id: uuidv4() }

  folders.push(newFolder)
  await fs.writeFile(path.join(SNIPPETS_DIR, 'folders.json'), JSON.stringify(folders, null, 2))

  return newFolder
}

/**
 * Deletes a folder from folders.json
 * @throws {Error} If the folder doesn't exist
 */
export async function deleteFolder(id: string): Promise<void> {
  await ensureSnippetsDirectory()

  const folders = await readFolders()
  const folderIndex = folders.findIndex((folder) => folder.id === id)

  if (folderIndex === -1) {
    throw new Error(`Folder with id ${id} not found`)
  }

  folders.splice(folderIndex, 1)
  await fs.writeFile(path.join(SNIPPETS_DIR, 'folders.json'), JSON.stringify(folders, null, 2))
}
