import fs from 'fs/promises'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateDeterministicUuid } from './snippets.browser'
import {
  createFolder,
  deleteFolder,
  deleteSnippet,
  getFilesystemEntries,
  getFolders,
  getSnippet,
  getSnippets,
  saveSnippet,
  updateSnippet,
  type Snippet,
} from './snippets.utils'

// Mock fs/promises — explicit factory required since Vitest 4 automocking
// doesn't create mock functions for getter-based exports on Node built-ins.
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
  },
}))
const mockedFS = vi.mocked(fs)

vi.mock('./snippets.constants', () => ({
  SNIPPETS_DIR: '/mock/snippets/dir',
}))

const MOCK_SNIPPETS_DIR = '/mock/snippets/dir'
const DEFAULT_BIRTHTIME = new Date('2023-01-01')

const file = (name: string) => ({ name, isDirectory: () => false, isFile: () => true })
const dir = (name: string) => ({ name, isDirectory: () => true, isFile: () => false })
type Dirent = ReturnType<typeof file>

/**
 * Mocks an existing snippets directory. `root` lists entries at the top level, `folders` maps
 * folder names to their entries. File contents default to `content` unless `contents` has an
 * entry for the file name.
 */
function mockTree({
  root,
  folders = {},
  content = 'SELECT 1;',
  contents = {},
}: {
  root: Dirent[]
  folders?: Record<string, Dirent[]>
  content?: string
  contents?: Record<string, string>
}) {
  mockedFS.access.mockResolvedValue(undefined)
  mockedFS.readdir.mockImplementation(((dirPath: string) => {
    if (dirPath === MOCK_SNIPPETS_DIR) return Promise.resolve(root)
    const folderName = path.relative(MOCK_SNIPPETS_DIR, dirPath)
    return Promise.resolve(folders[folderName] ?? [])
  }) as never)
  mockedFS.readFile.mockImplementation(((filePath: string) =>
    Promise.resolve(contents[path.basename(filePath)] ?? content)) as never)
  mockedFS.stat.mockResolvedValue({ birthtime: DEFAULT_BIRTHTIME } as never)
}

const makeSnippet = (overrides: Partial<Snippet>): Snippet => ({
  id: 'test-id',
  inserted_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  type: 'sql',
  name: 'test-snippet',
  description: '',
  favorite: false,
  content: { sql: 'SELECT * FROM test;', content_id: 'content-id', schema_version: '1.0' },
  visibility: 'user',
  project_id: 1,
  folder_id: null,
  owner_id: 1,
  owner: { id: 1, username: 'testuser' },
  updated_by: { id: 1, username: 'testuser' },
  ...overrides,
})

const errnoError = (message: string, code: string) =>
  Object.assign(new Error(message), { code }) satisfies NodeJS.ErrnoException

const UNSAFE_NAMES = [
  ['../ traversal', '../malicious'],
  ['nested directories', 'foo/bar/malicious'],
  ['null bytes', 'malicious\0name'],
  ['absolute path', '/etc/passwd'],
]

describe('snippets.utils', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getFilesystemEntries', () => {
    it('should create the snippets directory if it does not exist', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory not found'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await getFilesystemEntries()

      expect(mockedFS.mkdir).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR, { recursive: true })
    })

    it('should read SQL files from the root and from folders, ignoring non-SQL files', async () => {
      mockTree({
        root: [file('root-snippet.sql'), dir('folder1'), file('not-sql.txt')],
        folders: { folder1: [file('folder1-snippet.sql')] },
        contents: {
          'root-snippet.sql': 'SELECT * FROM root;',
          'folder1-snippet.sql': 'SELECT * FROM folder1_table;',
        },
      })

      const entries = await getFilesystemEntries()

      expect(entries).toHaveLength(3)
      expect(entries).toContainEqual(
        expect.objectContaining({ type: 'folder', name: 'folder1', folderId: null })
      )
      expect(entries).toContainEqual(
        expect.objectContaining({
          type: 'file',
          name: 'root-snippet',
          content: 'SELECT * FROM root;',
          folderId: null,
        })
      )
      expect(entries).toContainEqual(
        expect.objectContaining({
          type: 'file',
          name: 'folder1-snippet',
          content: 'SELECT * FROM folder1_table;',
          folderId: generateDeterministicUuid(['folder1']),
        })
      )
    })

    it('should skip subdirectories inside folders (not supported)', async () => {
      mockTree({
        root: [dir('folder1')],
        folders: { folder1: [file('snippet.sql'), dir('subfolder')] },
      })

      const entries = await getFilesystemEntries()

      expect(entries.map((e) => e.type).sort()).toEqual(['file', 'folder'])
    })

    it('should handle empty SQL files', async () => {
      mockTree({ root: [file('empty.sql')], content: '' })

      const entries = await getFilesystemEntries()

      expect(entries).toHaveLength(1)
      expect(entries[0].content).toBe('')
    })

    it('should propagate file read errors', async () => {
      mockTree({ root: [file('error.sql')] })
      mockedFS.readFile.mockRejectedValue(new Error('Permission denied'))

      await expect(getFilesystemEntries()).rejects.toThrow('Permission denied')
    })

    it('should propagate mkdir failure', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory not found'))
      mockedFS.mkdir.mockRejectedValue(new Error('Permission denied'))

      await expect(getFilesystemEntries()).rejects.toThrow('Permission denied')
    })

    it('should skip reading file content when includeContent is false', async () => {
      mockTree({ root: [file('snippet1.sql'), file('snippet2.sql')] })

      const entries = await getFilesystemEntries({ includeContent: false })

      expect(entries).toHaveLength(2)
      expect(entries.every((f) => f.content === undefined)).toBe(true)
      // Listings should never touch file contents off disk.
      expect(mockedFS.readFile).not.toHaveBeenCalled()
    })
  })

  describe('getSnippet', () => {
    it('should get a specific snippet by id', async () => {
      mockTree({ root: [file('test-snippet.sql')], content: 'SELECT * FROM test;' })

      const snippet = await getSnippet(generateDeterministicUuid(['test-snippet.sql']))

      expect(snippet).toMatchObject({
        name: 'test-snippet',
        content: { sql: 'SELECT * FROM test;' },
        folder_id: null,
      })
    })

    it('should get a snippet from a folder', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])
      mockTree({
        root: [dir('my-folder')],
        folders: { 'my-folder': [file('folder-snippet.sql')] },
        content: 'SELECT * FROM folder_table;',
      })

      const snippet = await getSnippet(generateDeterministicUuid([folderId, 'folder-snippet.sql']))

      expect(snippet).toMatchObject({
        name: 'folder-snippet',
        content: { sql: 'SELECT * FROM folder_table;' },
        folder_id: folderId,
      })
    })

    it('should throw error when snippet not found', async () => {
      mockTree({ root: [] })

      await expect(getSnippet('non-existent-id')).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })
  })

  describe('getSnippets', () => {
    it('should get only root snippets when folderId is null', async () => {
      mockTree({
        root: [file('snippet1.sql'), file('snippet2.sql'), dir('folder1')],
        folders: { folder1: [file('nested.sql')] },
      })

      const result = await getSnippets({ folderId: null, sort: 'name', sortOrder: 'asc' })

      expect(result.snippets.map((s) => s.name)).toEqual(['snippet1', 'snippet2'])
      expect(result.snippets.every((s) => s.folder_id === null)).toBe(true)
      expect(result.cursor).toBeUndefined()
    })

    it('should get snippets from a specific folder', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])
      mockTree({
        root: [file('root-snippet.sql'), dir('my-folder')],
        folders: { 'my-folder': [file('folder-snippet.sql')] },
      })

      const result = await getSnippets({ folderId })

      expect(result.snippets).toHaveLength(1)
      expect(result.snippets[0]).toMatchObject({ name: 'folder-snippet', folder_id: folderId })
    })

    it('should return empty result when no snippets in folder', async () => {
      mockTree({ root: [] })

      const result = await getSnippets({ folderId: generateDeterministicUuid(['empty-folder']) })

      expect(result.snippets).toEqual([])
      expect(result.cursor).toBeUndefined()
    })

    it('should filter by search term case-insensitively across all folders', async () => {
      mockTree({
        root: [
          file('USER-query.sql'),
          file('admin-report.sql'),
          file('Test-User-Data.sql'),
          dir('my-folder'),
        ],
        folders: { 'my-folder': [file('user-permissions.sql')] },
      })

      const result = await getSnippets({ searchTerm: 'user', sort: 'name', sortOrder: 'asc' })

      expect(result.snippets.map((s) => s.name)).toEqual([
        'Test-User-Data',
        'user-permissions',
        'USER-query',
      ])
    })

    it('should ignore a whitespace-only search term and filter by folderId', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])
      mockTree({
        root: [file('root-snippet.sql'), dir('my-folder')],
        folders: { 'my-folder': [file('folder-snippet.sql')] },
      })

      const result = await getSnippets({ searchTerm: '   ', folderId })

      expect(result.snippets.map((s) => s.name)).toEqual(['folder-snippet'])
    })

    it.each([
      ['asc', ['Apple', 'banana', 'zebra']],
      ['desc', ['zebra', 'banana', 'Apple']],
    ] as const)('should sort by name case-insensitively (%s)', async (sortOrder, expected) => {
      mockTree({ root: [file('zebra.sql'), file('Apple.sql'), file('banana.sql')] })

      const result = await getSnippets({ sort: 'name', sortOrder })

      expect(result.snippets.map((s) => s.name)).toEqual(expected)
    })

    it('should sort snippets by creation date', async () => {
      mockTree({ root: [file('newest.sql'), file('oldest.sql'), file('middle.sql')] })
      const birthtimes: Record<string, string> = {
        'newest.sql': '2023-03-01',
        'oldest.sql': '2023-01-01',
        'middle.sql': '2023-02-01',
      }
      mockedFS.stat.mockImplementation(((filePath: string) =>
        Promise.resolve({ birthtime: new Date(birthtimes[path.basename(filePath)]) })) as never)

      const resultDesc = await getSnippets({ sort: 'inserted_at', sortOrder: 'desc' })
      expect(resultDesc.snippets.map((s) => s.name)).toEqual(['newest', 'middle', 'oldest'])

      const resultAsc = await getSnippets({ sort: 'inserted_at', sortOrder: 'asc' })
      expect(resultAsc.snippets.map((s) => s.name)).toEqual(['oldest', 'middle', 'newest'])
    })

    it('should paginate with limit and cursor', async () => {
      mockTree({ root: [file('snippet1.sql'), file('snippet2.sql'), file('snippet3.sql')] })

      const firstPage = await getSnippets({ limit: 2, sort: 'name', sortOrder: 'asc' })
      expect(firstPage.snippets.map((s) => s.name)).toEqual(['snippet1', 'snippet2'])
      expect(firstPage.cursor).toBeDefined()

      const secondPage = await getSnippets({
        cursor: firstPage.cursor,
        limit: 2,
        sort: 'name',
        sortOrder: 'asc',
      })
      expect(secondPage.snippets.map((s) => s.name)).toEqual(['snippet3'])
    })

    it('should ignore an invalid cursor', async () => {
      mockTree({ root: [file('snippet1.sql')] })

      const result = await getSnippets({ cursor: 'invalid-cursor-id' })

      expect(result.snippets.map((s) => s.name)).toEqual(['snippet1'])
    })

    it('should propagate filesystem errors', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory not accessible'))
      mockedFS.mkdir.mockRejectedValue(new Error('Directory not accessible'))

      await expect(getSnippets({})).rejects.toThrow('Directory not accessible')
    })

    it('should return correct snippet structure', async () => {
      mockTree({ root: [file('test-snippet.sql')], content: 'SELECT * FROM users;' })
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01T10:00:00Z') } as never)

      const result = await getSnippets({})

      expect(result.snippets).toHaveLength(1)
      expect(result.snippets[0]).toMatchObject({
        id: expect.any(String),
        name: 'test-snippet',
        type: 'sql',
        content: { sql: 'SELECT * FROM users;', schema_version: '1.0' },
        visibility: 'user',
        folder_id: null,
        inserted_at: '2023-01-01T10:00:00.000Z',
        updated_at: '2023-01-01T10:00:00.000Z',
      })
    })

    it('should validate the limit parameter', async () => {
      await expect(getSnippets({ limit: 0 })).rejects.toThrow('Limit must be a positive number')
      await expect(getSnippets({ limit: -5 })).rejects.toThrow('Limit must be a positive number')
      await expect(getSnippets({ limit: 1001 })).rejects.toThrow('Limit cannot exceed 1000')

      mockTree({ root: [file('snippet1.sql')] })
      await expect(getSnippets({ limit: 1000 })).resolves.toMatchObject({
        snippets: [expect.objectContaining({ name: 'snippet1' })],
      })
    })

    it('should omit content but keep metadata when includeContent is false', async () => {
      mockTree({ root: [file('test-snippet.sql')] })

      const result = await getSnippets({ includeContent: false })

      expect(result.snippets).toHaveLength(1)
      const snippet = result.snippets[0]
      // Matches the Management API folder-listing contract: metadata, no SQL body.
      expect(snippet).not.toHaveProperty('content')
      expect(snippet).toMatchObject({ name: 'test-snippet', type: 'sql', folder_id: null })
      // Listing must not read file contents off disk.
      expect(mockedFS.readFile).not.toHaveBeenCalled()
    })

    it('searches by name without reading content when includeContent is false', async () => {
      mockTree({ root: [file('user-query.sql'), file('admin-report.sql')] })

      const result = await getSnippets({ searchTerm: 'user', includeContent: false })

      expect(result.snippets.map((s) => s.name)).toEqual(['user-query'])
      expect(mockedFS.readFile).not.toHaveBeenCalled()
    })
  })

  describe('saveSnippet', () => {
    it.each([
      ['regular content', 'test-snippet', 'SELECT * FROM test;'],
      ['empty content', 'empty-snippet', ''],
      ['special characters in the name', 'my-snippet_v2 (copy)', 'SELECT 1;'],
    ])('should save a snippet with %s', async (_, name, sql) => {
      mockTree({ root: [] })

      const result = await saveSnippet(
        makeSnippet({ name, content: { sql, content_id: 'c', schema_version: '1.0' } })
      )

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, `${name}.sql`),
        sql,
        'utf-8'
      )
      expect(result.name).toBe(name)
      expect(result.content.sql).toBe(sql)
    })

    it('should throw error when snippet already exists', async () => {
      const snippet = makeSnippet({
        id: generateDeterministicUuid(['existing-snippet.sql']),
        name: 'existing-snippet',
      })
      mockTree({ root: [file('existing-snippet.sql')] })

      await expect(saveSnippet(snippet)).rejects.toThrow(
        `Snippet with id ${snippet.id} already exists`
      )
    })

    it('should save snippet to a folder when folder_id is provided', async () => {
      const folderId = generateDeterministicUuid(['test-folder'])
      mockTree({ root: [dir('test-folder')] })

      const result = await saveSnippet(makeSnippet({ name: 'folder-snippet', folder_id: folderId }))

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'test-folder', 'folder-snippet.sql'),
        'SELECT * FROM test;',
        'utf-8'
      )
      expect(result.folder_id).toBe(folderId)
    })

    it('should throw error when folder_id is provided but folder does not exist', async () => {
      mockTree({ root: [] })

      await expect(
        saveSnippet(makeSnippet({ folder_id: 'non-existent-folder-id' }))
      ).rejects.toThrow('Folder with id non-existent-folder-id not found')
    })

    it.each(UNSAFE_NAMES)('should reject unsafe names (%s)', async (_, name) => {
      mockTree({ root: [] })

      await expect(saveSnippet(makeSnippet({ name }))).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
      expect(mockedFS.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('deleteSnippet', () => {
    it('should delete a snippet file', async () => {
      mockTree({ root: [file('test-snippet.sql')] })

      await deleteSnippet(generateDeterministicUuid(['test-snippet.sql']))

      expect(mockedFS.unlink).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'test-snippet.sql'))
    })

    it('should delete a snippet file from a folder', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])
      mockTree({
        root: [dir('my-folder')],
        folders: { 'my-folder': [file('folder-snippet.sql')] },
      })

      await deleteSnippet(generateDeterministicUuid([folderId, 'folder-snippet.sql']))

      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'my-folder', 'folder-snippet.sql')
      )
    })

    it('should not throw when the file is already gone (ENOENT)', async () => {
      mockTree({ root: [file('test-snippet.sql')] })
      mockedFS.unlink.mockRejectedValue(errnoError('File not found', 'ENOENT'))

      await expect(
        deleteSnippet(generateDeterministicUuid(['test-snippet.sql']))
      ).resolves.toBeUndefined()
    })

    it('should throw for other filesystem errors', async () => {
      mockTree({ root: [file('test-snippet.sql')] })
      mockedFS.unlink.mockRejectedValue(errnoError('Permission denied', 'EACCES'))

      await expect(deleteSnippet(generateDeterministicUuid(['test-snippet.sql']))).rejects.toThrow(
        'Permission denied'
      )
    })

    it('should throw error when snippet not found', async () => {
      mockTree({ root: [] })

      await expect(deleteSnippet('non-existent-id')).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })
  })

  describe('updateSnippet', () => {
    const id = generateDeterministicUuid(['existing-snippet.sql'])
    const targetFolderId = generateDeterministicUuid(['target-folder'])

    it('should rename and update content, removing the old file', async () => {
      mockTree({ root: [file('existing-snippet.sql')], content: 'SELECT * FROM old;' })

      const result = await updateSnippet(id, {
        name: 'updated-snippet',
        content: { sql: 'SELECT * FROM new;' },
      })

      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'updated-snippet.sql'),
        'SELECT * FROM new;',
        'utf-8'
      )
      expect(result.name).toBe('updated-snippet')
      expect(result.content.sql).toBe('SELECT * FROM new;')
    })

    it('should update only provided fields', async () => {
      mockTree({ root: [file('existing-snippet.sql')], content: 'SELECT * FROM old;' })

      const result = await updateSnippet(id, { name: 'new-name' })

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })

    it('should update content to empty string', async () => {
      mockTree({ root: [file('existing-snippet.sql')], content: 'SELECT * FROM old;' })

      const result = await updateSnippet(id, { content: { sql: '' } })

      expect(result.content.sql).toBe('')
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql'),
        '',
        'utf-8'
      )
    })

    it('should throw error when snippet not found', async () => {
      mockTree({ root: [] })

      await expect(updateSnippet('non-existent-id', {})).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })

    it('should move snippet to a folder, renaming it at the same time', async () => {
      mockTree({
        root: [file('existing-snippet.sql'), dir('target-folder')],
        content: 'SELECT * FROM old;',
      })

      const result = await updateSnippet(id, {
        name: 'renamed-snippet',
        folder_id: targetFolderId,
        content: { sql: 'SELECT * FROM new;' },
      })

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'target-folder', 'renamed-snippet.sql'),
        'SELECT * FROM new;',
        'utf-8'
      )
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(result).toMatchObject({ name: 'renamed-snippet', folder_id: targetFolderId })
    })

    it('should move snippet from folder to root when folder_id is set to null', async () => {
      const folderId = generateDeterministicUuid(['source-folder'])
      mockTree({
        root: [dir('source-folder')],
        folders: { 'source-folder': [file('existing-snippet.sql')] },
        content: 'SELECT * FROM folder;',
      })

      const result = await updateSnippet(
        generateDeterministicUuid([folderId, 'existing-snippet.sql']),
        { folder_id: null }
      )

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql'),
        'SELECT * FROM folder;',
        'utf-8'
      )
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'source-folder', 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(null)
    })

    it('should throw error when trying to move to non-existent folder', async () => {
      mockTree({ root: [file('existing-snippet.sql')] })

      await expect(updateSnippet(id, { folder_id: 'non-existent-folder-id' })).rejects.toThrow(
        'Folder with id non-existent-folder-id not found'
      )
    })

    it('should throw when the target folder already contains a snippet with the same name', async () => {
      mockTree({
        root: [file('existing-snippet.sql'), dir('target-folder')],
        folders: { 'target-folder': [file('existing-snippet.sql')] },
      })

      await expect(updateSnippet(id, { folder_id: targetFolderId })).rejects.toThrow(
        'Snippet named "existing-snippet" already exists in the specified folder'
      )
    })

    it('should throw when old file deletion fails with an error other than ENOENT', async () => {
      mockTree({ root: [file('existing-snippet.sql')] })
      mockedFS.unlink.mockRejectedValue(errnoError('Permission denied', 'EACCES'))

      await expect(updateSnippet(id, { name: 'new-name' })).rejects.toThrow('Permission denied')
    })

    it('should continue when old file deletion fails with ENOENT', async () => {
      mockTree({ root: [file('existing-snippet.sql')], content: 'SELECT * FROM old;' })
      mockedFS.unlink.mockRejectedValue(errnoError('File not found', 'ENOENT'))

      const result = await updateSnippet(id, { name: 'new-name' })

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })
  })

  describe('getFolders', () => {
    it('should return only directories, with deterministic ids', async () => {
      mockTree({ root: [dir('folder1'), dir('folder2'), file('snippet.sql')] })

      const folders = await getFolders()

      expect(folders.map((f) => ({ id: f.id, name: f.name }))).toEqual([
        { id: generateDeterministicUuid(['folder1']), name: 'folder1' },
        { id: generateDeterministicUuid(['folder2']), name: 'folder2' },
      ])
    })

    it('should return empty array when no directories exist', async () => {
      mockTree({ root: [file('snippet.sql')] })

      expect(await getFolders()).toEqual([])
    })
  })

  describe('createFolder', () => {
    it('should create a new folder as an actual directory', async () => {
      const name = 'Folder with spaces & symbols!'
      mockTree({ root: [] })

      const result = await createFolder(name)

      expect(result.id).toBe(generateDeterministicUuid([name]))
      expect(result.name).toBe(name)
      expect(mockedFS.mkdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, name), {
        recursive: true,
      })
    })

    it('should throw error when folder already exists', async () => {
      mockTree({ root: [dir('Existing Folder')] })

      await expect(createFolder('Existing Folder')).rejects.toThrow(
        'Folder with name Existing Folder already exists'
      )
    })

    it('should propagate mkdir errors', async () => {
      mockTree({ root: [] })
      mockedFS.mkdir.mockRejectedValue(new Error('Permission denied'))

      await expect(createFolder('New Folder')).rejects.toThrow('Permission denied')
    })

    it.each(UNSAFE_NAMES)('should reject unsafe names (%s)', async (_, name) => {
      mockTree({ root: [] })

      await expect(createFolder(name)).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
      expect(mockedFS.mkdir).not.toHaveBeenCalled()
    })
  })

  describe('deleteFolder', () => {
    it('should delete only the targeted folder directory', async () => {
      mockTree({ root: [dir('Delete Me'), dir('Keep Me')] })

      await deleteFolder(generateDeterministicUuid(['Delete Me']))

      expect(mockedFS.rm).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'Delete Me'), {
        recursive: true,
        force: true,
      })
      expect(mockedFS.rm).not.toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'Keep Me'),
        expect.anything()
      )
    })

    it('should throw error when folder not found', async () => {
      mockTree({ root: [] })

      await expect(deleteFolder('non-existent-folder-id')).rejects.toThrow(
        'Folder with id non-existent-folder-id not found'
      )
    })

    it('should propagate directory deletion errors', async () => {
      mockTree({ root: [dir('Test Folder')] })
      mockedFS.rm.mockRejectedValue(errnoError('Permission denied', 'EACCES'))

      await expect(deleteFolder(generateDeterministicUuid(['Test Folder']))).rejects.toThrow(
        'Permission denied'
      )
    })

    it('should report not found when the directory disappears during deletion (ENOENT)', async () => {
      const folderId = generateDeterministicUuid(['Test Folder'])
      mockTree({ root: [dir('Test Folder')] })
      mockedFS.rm.mockRejectedValue(errnoError('Directory not found', 'ENOENT'))

      await expect(deleteFolder(folderId)).rejects.toThrow(`Folder with id ${folderId} not found`)
    })
  })
})
