import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

import { SNIPPETS_DIR } from '../snippets.constants'

const NOTEBOOKS_DIR = path.join(SNIPPETS_DIR, '.notebooks')

const cellSchema = z
  .object({
    _tag: z.enum(['markdown_cell', 'database_cell', 'log_cell']),
    _id: z.string().optional(),
  })
  .passthrough()

const notebookPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.literal('notebook'),
  visibility: z.enum(['project', 'user']).default('project'),
  favorite: z.boolean().default(false),
  content: z.object({
    schema_version: z.literal(1),
    cells: z.array(cellSchema),
  }),
})

const storedNotebookSchema = notebookPayloadSchema.extend({
  inserted_at: z.string(),
  updated_at: z.string(),
  content: z.object({
    schema_version: z.literal(1),
    cells: z.array(cellSchema.extend({ _id: z.string() })),
  }),
})

export type StoredNotebook = z.infer<typeof storedNotebookSchema> & {
  project_id: number
  folder_id: null
  owner_id: number
  owner: { id: number; username: string }
  updated_by: { id: number; username: string }
}

const OWNER = { id: 1, username: 'johndoe' }

export const isNotebookPayload = (body: unknown): boolean =>
  typeof body === 'object' && body !== null && 'type' in body && body.type === 'notebook'

const notebookPath = (id: string, dir: string) => path.join(dir, `${id}.json`)

const isUuid = (id: string) => z.string().uuid().safeParse(id).success

const withOwner = (notebook: z.infer<typeof storedNotebookSchema>): StoredNotebook => ({
  ...notebook,
  project_id: 1,
  folder_id: null,
  owner_id: OWNER.id,
  owner: OWNER,
  updated_by: OWNER,
})

export async function getNotebook(id: string, dir = NOTEBOOKS_DIR): Promise<StoredNotebook | null> {
  if (!isUuid(id)) return null

  try {
    const raw = await fs.readFile(notebookPath(id, dir), 'utf-8')
    return withOwner(storedNotebookSchema.parse(JSON.parse(raw)))
  } catch (error) {
    if (isMissingFile(error)) return null
    throw error
  }
}

export async function saveNotebook(body: unknown, dir = NOTEBOOKS_DIR): Promise<StoredNotebook> {
  const payload = notebookPayloadSchema.parse(body)
  const existing = await getNotebook(payload.id, dir)
  const now = new Date().toISOString()

  const notebook = storedNotebookSchema.parse({
    ...payload,
    inserted_at: existing?.inserted_at ?? now,
    updated_at: now,
    content: {
      schema_version: 1,
      cells: payload.content.cells.map((cell) => ({
        ...cell,
        _id: cell._id ?? crypto.randomUUID(),
      })),
    },
  })

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(notebookPath(notebook.id, dir), JSON.stringify(notebook, null, 2))
  return withOwner(notebook)
}

export async function listNotebooks(
  { name, limit }: { name?: string; limit?: number },
  dir = NOTEBOOKS_DIR
): Promise<StoredNotebook[]> {
  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch (error) {
    if (isMissingFile(error)) return []
    throw error
  }

  const notebooks = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map((file) => getNotebook(file.slice(0, -5), dir))
  )
  const search = name?.toLowerCase()

  return notebooks
    .filter((notebook): notebook is StoredNotebook => notebook !== null)
    .filter((notebook) => !search || notebook.name.toLowerCase().includes(search))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit)
}

export async function deleteNotebook(id: string, dir = NOTEBOOKS_DIR): Promise<boolean> {
  if (!isUuid(id)) return false

  try {
    await fs.unlink(notebookPath(id, dir))
    return true
  } catch (error) {
    if (isMissingFile(error)) return false
    throw error
  }
}

const isMissingFile = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT'
