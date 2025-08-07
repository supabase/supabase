import fs from 'fs/promises'
import { compact } from 'lodash'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { generateDeterministicUuid } from './snippets.browser'
import { SNIPPETS_DIR } from './snippets.constants'

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export const SnippetSchema = z.object({
  id: z.string(),
  inserted_at: z.string().default(new Date().toISOString()),
  updated_at: z.string().default(new Date().toISOString()),
  type: z.literal('sql'),
  name: z.string(),
  description: z.string().optional(),
  favorite: z.boolean().default(false),
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
  project_id: z.number().default(1),
  folder_id: z.string().nullable().default(null),
  owner_id: z.number().default(1),
  owner: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .default({ id: 1, username: 'johndoe' }),
  updated_by: z
    .object({
      id: z.number(),
      username: z.string(),
    })
    .default({ id: 1, username: 'johndoe' }),
})

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.number().default(1),
  parent_id: z.string().nullable(),
  project_id: z.number().default(1),
})

export type Snippet = z.infer<typeof SnippetSchema>
export type Folder = z.infer<typeof FolderSchema>

export type FilesystemEntry = {
  id: string
  name: string
  type: 'file' | 'folder'
  folderId: string | null
  content?: string // Only for files
}

const buildSnippet = (filename: string, content: string, folderId: string | null) => {
  const snippet: Snippet = {
    id: generateDeterministicUuid([folderId, filename]),
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    type: 'sql',
    name: filename.replace('.sql', ''),
    description: '',
    favorite: false,
    content: {
      sql: content, // Default content
      favorite: false,
      content_id: uuidv4(),
      schema_version: '1.0',
    },
    visibility: 'user',
    project_id: 1,
    folder_id: folderId,
    owner_id: 1,
    owner: { id: 1, username: 'johndoe' },
    updated_by: { id: 1, username: 'johndoe' },
  }

  return snippet
}

const buildFolder = (name: string) => {
  const folder: Folder = {
    id: generateDeterministicUuid([name]),
    name: name,
    owner_id: 1,
    parent_id: null,
    project_id: 1,
  }

  return folder
}

/**
 * Gets a complete snapshot of the filesystem structure including files and folders
 * @returns An array of files and folders with their metadata
 */
export async function getFilesystemEntries(): Promise<FilesystemEntry[]> {
  // Ensure the snippets directory exists
  try {
    await fs.access(SNIPPETS_DIR)
  } catch {
    await fs.mkdir(SNIPPETS_DIR, { recursive: true })
  }

  const entries: FilesystemEntry[] = []

  const readEntriesRecursively = async (
    dirPath: string,
    folderName: string | null
  ): Promise<void> => {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const folderId = folderName ? generateDeterministicUuid([folderName]) : null

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)

      if (item.isDirectory()) {
        // if the folder entry is under another folder, skip it. Subdirectories are not supported.
        if (folderName) {
          continue
        }

        // Add folder entry
        entries.push({
          id: generateDeterministicUuid([folderId, item.name]),
          name: item.name,
          type: 'folder',
          // Folders are always at root level in this implementation
          folderId: null,
        })

        await readEntriesRecursively(itemPath, item.name)
      } else if (item.isFile() && item.name.endsWith('.sql')) {
        const content = await fs.readFile(itemPath, 'utf-8')
        const snippetName = item.name.replace('.sql', '')

        entries.push({
          id: generateDeterministicUuid([folderId, snippetName]),
          name: item.name.replace('.sql', ''),
          type: 'file',
          folderId: folderId,
          content: content,
        })
      }
    }
  }

  await readEntriesRecursively(SNIPPETS_DIR, null)
  return entries
}

export const getSnippet = async (snippetId: string) => {
  const entries = await getFilesystemEntries()
  const foundSnippet = entries.find((e) => e.type === 'file' && e.id === snippetId)

  if (!foundSnippet) {
    throw new Error(`Snippet with id ${snippetId} not found`)
  }

  return buildSnippet(foundSnippet.name, foundSnippet.content || '', foundSnippet.folderId)
}

export const getSnippets = async (folderId: string | null = null): Promise<Snippet[]> => {
  const entries = await getFilesystemEntries()
  const files = entries.filter(
    (entry): entry is FilesystemEntry & { type: 'file'; content: string } =>
      entry.type === 'file' && entry.folderId === folderId
  )
  const snippets = files.map((file) => buildSnippet(file.name, file.content, file.folderId))
  return snippets
}

/**
 * Saves a snippet to the filesystem
 */
export async function saveSnippet(snippet: Snippet): Promise<Snippet> {
  const entries = await getFilesystemEntries()
  const existingSnippet = entries.find((entry) => entry.id === snippet.id && entry.type === 'file')

  if (existingSnippet) {
    throw new Error(`Snippet with id ${snippet.id} already exists`)
  }

  // check if the folder exists
  if (snippet.folder_id !== null) {
    const existingFolder = entries.find(
      (entry) => entry.id === snippet.folder_id && entry.type === 'folder'
    )
    if (existingFolder === undefined) {
      throw new Error(`Folder with id ${snippet.folder_id} not found`)
    }
  }

  const snippetName = snippet.name
  const content = snippet.content.sql || ''
  const folderId = snippet.folder_id || null
  const folder = entries.find((f) => f.id === folderId && f.type === 'folder')

  const folderPath = folder ? path.join(SNIPPETS_DIR, folder.name) : SNIPPETS_DIR
  const filePath = path.join(folderPath, `${snippetName}.sql`)
  await fs.writeFile(filePath, content || '', 'utf-8')

  const result = buildSnippet(snippetName, content, snippet.folder_id)
  return result
}

/**
 * Deletes a snippet from the filesystem
 */
export async function deleteSnippet(id: string): Promise<void> {
  const entries = await getFilesystemEntries()
  const found = entries.find((entry) => entry.id === id && entry.type === 'file')

  if (!found) {
    throw new Error(`Snippet with id ${id} not found`)
  }
  const snippet = buildSnippet(found.name, found.content || '', found.folderId)

  const filename = `${snippet.name}.sql`
  const currentFolder = entries.find((f) => f.id === snippet.folder_id && f.type === 'folder')
  const paths = compact([SNIPPETS_DIR, currentFolder?.name, filename])
  const filePath = path.join(...paths)

  try {
    await fs.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

/**
 * Updates a snippet in the filesystem. It also handles renaming and moving.
 */
export async function updateSnippet(id: string, updates: DeepPartial<Snippet>): Promise<Snippet> {
  const entries = await getFilesystemEntries()
  const foundSnippet = entries
    .filter(
      (entry): entry is FilesystemEntry & { type: 'file'; content: string } => entry.type === 'file'
    )
    .find((s) => s.id === id)

  if (!foundSnippet) {
    throw new Error(`Snippet with id ${id} not found`)
  }

  const newId = generateDeterministicUuid([
    updates.folder_id !== undefined ? updates.folder_id : foundSnippet.folderId,
    updates.name ?? foundSnippet.name,
  ])

  const snippetAtTargetLocation = entries.find(
    (entry) => entry.id === newId && entry.type === 'file'
  )

  if (snippetAtTargetLocation && snippetAtTargetLocation.id !== foundSnippet.id) {
    throw new Error(
      `Snippet named "${updates.name ?? foundSnippet.name}" already exists in the specified folder`
    )
  }

  const snippet = buildSnippet(foundSnippet.name, foundSnippet.content || '', foundSnippet.folderId)

  // it's easier to delete the old file first and then recreate a new one
  await deleteSnippet(snippet.id)

  const updatedSnippet = await saveSnippet({
    name: updates.name ?? snippet.name,
    content: updates.content ?? snippet.content,
    // folder_id can be null
    folder_id: updates.folder_id !== undefined ? updates.folder_id : snippet.folder_id,
  } as Snippet)

  return updatedSnippet
}

export const getFolders = async (folderId: string | null = null): Promise<Folder[]> => {
  const entries = await getFilesystemEntries()
  const folders = entries
    .filter(
      (entry): entry is FilesystemEntry & { type: 'folder' } =>
        entry.type === 'folder' && entry.folderId === folderId
    )
    .map((folder) => buildFolder(folder.name))
  return folders
}

/**
 * Creates a new folder as an actual directory
 */
export async function createFolder(folderName: string): Promise<Folder> {
  const entries = await getFilesystemEntries()
  const existingFolder = entries.find((folder) => folder.name === folderName)

  if (existingFolder) {
    throw new Error(`Folder with name ${folderName} already exists`)
  }

  const folderPath = path.join(SNIPPETS_DIR, folderName)

  await fs.mkdir(folderPath, { recursive: true })
  const newFolder = buildFolder(folderName)

  return newFolder
}

/**
 * Deletes a folder directory from the filesystem
 * @throws {Error} If the folder doesn't exist
 */
export async function deleteFolder(id: string): Promise<void> {
  const entries = await getFilesystemEntries()
  const folder = entries.find((f) => f.id === id && f.type === 'folder')

  if (!folder) {
    throw new Error(`Folder with id ${id} not found`)
  }

  const folderPath = path.join(SNIPPETS_DIR, folder.name)
  try {
    await fs.rmdir(folderPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
    // If folder doesn't exist, still throw the original error
    throw new Error(`Folder with id ${id} not found`)
  }
}
