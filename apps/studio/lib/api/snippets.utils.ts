import fs from 'fs/promises'
import { compact, sortBy } from 'lodash'
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
  id: z.string().uuid(),
  inserted_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
  type: z.literal('sql'),
  name: z.string(),
  description: z.string().optional(),
  favorite: z.boolean().default(false),
  content: z.object({
    sql: z.string(),
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
  createdAt: Date
}

const buildSnippet = (
  filename: string,
  content: string,
  folderId: string | null,
  createdAt: Date
) => {
  const snippet: Snippet = {
    id: generateDeterministicUuid([folderId, `${filename}.sql`]),
    inserted_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
    type: 'sql',
    name: filename.replace('.sql', ''),
    description: '',
    favorite: false,
    content: {
      sql: content, // Default content
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

const sanitizeName = (name: string): string => {
  // Remove path traversal sequences and normalize
  const sanitized = path.basename(name)
  if (sanitized !== name || name.includes('\0')) {
    throw new Error('Invalid name: path traversal or null bytes detected')
  }
  return sanitized
}

/**
 * Gets a complete snapshot of the filesystem structure including files and folders
 * @returns An array of files and folders with their metadata
 */
export async function getFilesystemEntries(): Promise<FilesystemEntry[]> {
  if (SNIPPETS_DIR === '') {
    throw new Error(
      'SNIPPETS_MANAGEMENT_FOLDER env var is not set. Please set it to use snippets properly.'
    )
  }

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

        const stats = await fs.stat(itemPath)

        // Add folder entry
        entries.push({
          id: generateDeterministicUuid([folderId, item.name]),
          name: item.name,
          type: 'folder',
          // Folders are always at root level in this implementation
          folderId: null,
          createdAt: stats.birthtime,
        })

        await readEntriesRecursively(itemPath, item.name)
      } else if (item.isFile() && item.name.endsWith('.sql')) {
        const [content, stats] = await Promise.all([
          fs.readFile(itemPath, 'utf-8'),
          fs.stat(itemPath),
        ])
        const snippetName = item.name.replace('.sql', '')

        entries.push({
          id: generateDeterministicUuid([folderId, `${snippetName}.sql`]),
          name: snippetName,
          type: 'file',
          folderId: folderId,
          content: content,
          createdAt: stats.birthtime,
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

  return buildSnippet(
    foundSnippet.name,
    foundSnippet.content || '',
    foundSnippet.folderId,
    foundSnippet.createdAt
  )
}

/**
 * Gets a filtered paginated list of snippets based on the provided criteria
 */
export const getSnippets = async ({
  searchTerm,
  limit,
  cursor,
  sort,
  sortOrder,
  folderId,
}: {
  searchTerm?: string
  limit?: number
  cursor?: string
  sortOrder?: 'asc' | 'desc'
  sort?: 'name' | 'inserted_at'
  folderId?: string | null
}): Promise<{ cursor: string | undefined; snippets: Snippet[] }> => {
  // Normalize and set default values
  const normalizedSearchTerm = searchTerm?.trim() ?? ''
  const normalizedLimit = limit ?? 100
  const normalizedSort = sort ?? 'inserted_at'
  const normalizedSortOrder = sortOrder ?? 'desc'
  const normalizedCursor = cursor ?? undefined
  const normalizedFolderId = folderId ?? null

  // Validate inputs
  if (normalizedLimit <= 0) {
    throw new Error('Limit must be a positive number')
  }
  if (normalizedLimit > 1000) {
    throw new Error('Limit cannot exceed 1000')
  }

  const entries = await getFilesystemEntries()
  const files = entries.filter(
    (entry): entry is FilesystemEntry & { type: 'file'; content: string } =>
      entry.type === 'file' && entry.content !== undefined && entry.content !== null
  )

  // Filter snippets based on search term or folder
  let filteredSnippets = files
  if (normalizedSearchTerm) {
    // When searching, look across all folders and support case-insensitive search
    filteredSnippets = files.filter((file) =>
      file.name.toLowerCase().includes(normalizedSearchTerm.toLowerCase())
    )
  } else {
    // Filter by specific folder or root (null)
    filteredSnippets = files.filter((file) => file.folderId === normalizedFolderId)
  }

  // Sort snippets
  const sortedSnippets = sortBy(filteredSnippets, (snippet) => {
    if (normalizedSort === 'inserted_at') {
      return snippet.createdAt.getTime()
    }
    return snippet.name.toLowerCase() // Case-insensitive name sorting
  })

  if (normalizedSortOrder === 'desc') {
    sortedSnippets.reverse()
  }

  // Apply cursor-based pagination
  let paginatedSnippets = sortedSnippets
  if (normalizedCursor) {
    const cursorIndex = sortedSnippets.findIndex((s) => s.id === normalizedCursor)
    if (cursorIndex !== -1) {
      paginatedSnippets = sortedSnippets.slice(cursorIndex + 1)
    }
    // If cursor not found, return all snippets (graceful degradation)
  }

  // Apply limit and determine next cursor
  let nextCursor: string | undefined = undefined
  let finalSnippets = paginatedSnippets

  if (normalizedLimit && paginatedSnippets.length > normalizedLimit) {
    finalSnippets = paginatedSnippets.slice(0, normalizedLimit)
    nextCursor = finalSnippets[finalSnippets.length - 1].id
  }

  return {
    cursor: nextCursor,
    snippets: finalSnippets.map((file) =>
      buildSnippet(file.name, file.content, file.folderId, file.createdAt)
    ),
  }
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

  const snippetName = sanitizeName(snippet.name)
  const content = snippet.content.sql || ''
  const folderId = snippet.folder_id || null
  const folder = entries.find((f) => f.id === folderId && f.type === 'folder')

  const folderPath = folder ? path.join(SNIPPETS_DIR, folder.name) : SNIPPETS_DIR
  const filePath = path.join(folderPath, `${snippetName}.sql`)
  await fs.writeFile(filePath, content || '', 'utf-8')
  const stats = await fs.stat(filePath)

  const result = buildSnippet(snippetName, content, snippet.folder_id, stats.birthtime)
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

  const filename = `${found.name}.sql`
  const currentFolder = entries.find((f) => f.id === found.folderId && f.type === 'folder')
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
    `${updates.name ?? foundSnippet.name}.sql`,
  ])

  const snippetAtTargetLocation = entries.find(
    (entry) => entry.id === newId && entry.type === 'file'
  )

  if (snippetAtTargetLocation && snippetAtTargetLocation.id !== foundSnippet.id) {
    throw new Error(
      `Snippet named "${updates.name ?? foundSnippet.name}" already exists in the specified folder`
    )
  }

  const snippet = buildSnippet(
    foundSnippet.name,
    foundSnippet.content || '',
    foundSnippet.folderId,
    foundSnippet.createdAt
  )

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
export async function createFolder(_folderName: string): Promise<Folder> {
  const folderName = sanitizeName(_folderName)

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
    await fs.rm(folderPath, { recursive: true, force: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
    // If folder doesn't exist, still throw the original error
    throw new Error(`Folder with id ${id} not found`)
  }
}
