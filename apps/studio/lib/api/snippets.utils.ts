import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { SNIPPETS_DIR } from './snippets.constants'

/**
 * Generates a deterministic UUID v4 from a string input
 * @param input - The string to generate a UUID from
 * @returns A deterministic UUID v4 string
 */
export function generateDeterministicUuid(input: string): string {
  // Create a hash of the input string
  const hash = crypto.createHash('sha256').update(input).digest()

  // Create a deterministic random number generator using the hash as seed
  const rng = () => {
    const bytes = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
      bytes[i] = hash[i % hash.length]
    }
    return Array.from(bytes)
  }

  // Generate UUID v4 using the deterministic RNG
  return uuidv4({ rng })
}

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

const buildSnippet = (filename: string, content: string, folderId: string | null) => {
  const snippet: Snippet = {
    id: generateDeterministicUuid(filename),
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
    id: generateDeterministicUuid(name),
    name: name,
    owner_id: 1,
    parent_id: null,
    project_id: 1,
  }

  return folder
}

/**
 * Ensures the snippets directory exists
 */
export async function ensureSnippetsDirectory() {
  try {
    await fs.access(SNIPPETS_DIR)
  } catch {
    await fs.mkdir(SNIPPETS_DIR, { recursive: true })
  }
}

/**
 * Reads all snippets from the filesystem recursively
 */
export async function readAllSnippets(): Promise<Snippet[]> {
  await ensureSnippetsDirectory()

  const readSnippetsRecursively = async (
    dirPath: string,
    folderName: string | null
  ): Promise<Snippet[]> => {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const snippets: Snippet[] = []

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)

      if (item.isDirectory()) {
        // Recursively read snippets from subdirectories
        const subSnippets = await readSnippetsRecursively(itemPath, item.name)
        snippets.push(...subSnippets)
      } else if (item.isFile() && item.name.endsWith('.sql')) {
        // Read SQL file and create snippet
        const content = await fs.readFile(itemPath, 'utf-8')
        const folderId = folderName ? generateDeterministicUuid(folderName) : null
        snippets.push(buildSnippet(item.name, content, folderId))
      }
    }

    return snippets
  }

  return await readSnippetsRecursively(SNIPPETS_DIR, null)
}

/**
 * Saves a snippet to the filesystem
 */
export async function saveSnippet(snippet: Snippet): Promise<Snippet> {
  await ensureSnippetsDirectory()

  const snippetName = snippet.name
  const content = snippet.content.sql || ''

  const filePath = path.join(SNIPPETS_DIR, `${snippetName}.sql`)
  await fs.writeFile(filePath, JSON.stringify(content, null, 2))

  const result = buildSnippet(snippetName, content, snippet.folder_id)
  return result
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
 * Updates a snippet in the filesystem. It also handles renaming and moving.
 */
export async function updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet> {
  await ensureSnippetsDirectory()

  // You have to read all snippets to find the one to update
  const snippets = await readAllSnippets()
  const foundSnippet = snippets.find((s) => s.id === id)
  if (!foundSnippet) {
    throw new Error(`Snippet with id ${id} not found`)
  }

  try {
    const snippetName = updates.name ?? foundSnippet.name
    const snippetContent = updates.content?.sql ?? foundSnippet.content.sql
    const snippetFolderId = updates.folder_id ?? foundSnippet.folder_id

    const folders = await readFolders()
    // Determine the old file path
    const oldFileName = `${foundSnippet.name}.sql`
    let oldFilePath: string
    if (foundSnippet.folder_id) {
      const oldFolder = folders.find((f) => f.id === foundSnippet.folder_id)
      if (oldFolder) {
        oldFilePath = path.join(SNIPPETS_DIR, oldFolder.name, oldFileName)
      } else {
        oldFilePath = path.join(SNIPPETS_DIR, oldFileName)
      }
    } else {
      oldFilePath = path.join(SNIPPETS_DIR, oldFileName)
    }

    // Determine the new file path
    const newFileName = `${snippetName}.sql`
    let newFilePath: string
    if (snippetFolderId) {
      const newFolder = folders.find((f) => f.id === snippetFolderId)
      if (!newFolder) {
        throw new Error(`Folder with id ${snippetFolderId} not found`)
      }
      newFilePath = path.join(SNIPPETS_DIR, newFolder.name, newFileName)
    } else {
      newFilePath = path.join(SNIPPETS_DIR, newFileName)
    }

    // Write the file to the new location
    await fs.writeFile(newFilePath, JSON.stringify(snippetContent, null, 2))

    // If the file location changed, delete the old file
    if (oldFilePath !== newFilePath) {
      try {
        await fs.unlink(oldFilePath)
      } catch (error) {
        // If old file doesn't exist, that's ok - it might have been manually moved
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error
        }
      }
    }

    const updatedSnippet = buildSnippet(snippetName, snippetContent, snippetFolderId)
    return updatedSnippet
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Snippet with id ${id} not found`)
    }
    throw error
  }
}

/**
 * Reads all folders from the filesystem
 */
export async function readFolders(): Promise<Folder[]> {
  await ensureSnippetsDirectory()
  const items = await fs.readdir(SNIPPETS_DIR, { withFileTypes: true })

  const folders = items.filter((item) => item.isDirectory()).map((item) => buildFolder(item.name))

  return folders
}

/**
 * Creates a new folder as an actual directory
 */
export async function createFolder(folderName: string): Promise<Folder> {
  await ensureSnippetsDirectory()

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
  await ensureSnippetsDirectory()

  const folders = await readFolders()
  const folder = folders.find((f) => f.id === id)

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
