import fs from 'fs/promises'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

// Mock fs/promises
vi.mock('fs/promises')
const mockedFS = vi.mocked(fs)

// Mock SNIPPETS_DIR from constants
vi.mock('./snippets.constants', () => ({
  SNIPPETS_DIR: '/mock/snippets/dir',
}))

describe('snippets.utils', () => {
  const MOCK_SNIPPETS_DIR = '/mock/snippets/dir'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getFilesystemEntries', () => {
    it('should create the snippets directory if it does not exist', async () => {
      const accessError = new Error('Directory not found')
      mockedFS.access.mockRejectedValue(accessError)
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await getFilesystemEntries()

      expect(mockedFS.access).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR)
      expect(mockedFS.mkdir).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR, { recursive: true })
    })

    it('should read and parse SQL files from the snippets directory', async () => {
      const files = [
        {
          name: 'snippet1.sql',
          isDirectory: () => false,
          isFile: () => true,
        },
        {
          name: 'snippet2.sql',
          isDirectory: () => false,
          isFile: () => true,
        },
        {
          name: 'not-sql.txt',
          isDirectory: () => false,
          isFile: () => true,
        },
      ]

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(files as any)
      mockedFS.readFile
        .mockResolvedValueOnce('SELECT * FROM users;')
        .mockResolvedValueOnce('SELECT * FROM posts;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const entries = await getFilesystemEntries()

      expect(entries).toHaveLength(2)
      expect(entries[0].name).toBe('snippet1')
      expect(entries[0].content).toBe('SELECT * FROM users;')
      expect(entries[0].type).toBe('file')
      expect(entries[1].name).toBe('snippet2')
      expect(entries[1].content).toBe('SELECT * FROM posts;')
      expect(entries[1].type).toBe('file')
      expect(mockedFS.readFile).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when no SQL files exist', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'not-sql.txt', isDirectory: () => false, isFile: () => true },
      ] as any)

      const entries = await getFilesystemEntries()

      expect(entries).toEqual([])
    })

    it('should read SQL files from subdirectories (folders)', async () => {
      // Mock fs.Dirent objects for different file types
      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      // Mock the main directory structure
      const mainDirItems = [
        createMockDirent('root-snippet.sql', false),
        createMockDirent('folder1', true),
        createMockDirent('not-sql.txt', false),
      ]

      // Mock folder1 contents
      const folder1Items = [createMockDirent('folder1-snippet.sql', false)]

      mockedFS.access.mockResolvedValue(undefined)

      // Mock readdir to return different results based on the path
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve(mainDirItems as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'folder1')) {
          return Promise.resolve(folder1Items as any)
        }
        return Promise.resolve([])
      })

      // Mock readFile to return different content based on the file
      mockedFS.readFile.mockImplementation((filePath: any) => {
        const fileName = path.basename(filePath as string)
        switch (fileName) {
          case 'root-snippet.sql':
            return Promise.resolve('SELECT * FROM root;')
          case 'folder1-snippet.sql':
            return Promise.resolve('SELECT * FROM folder1_table;')
          default:
            return Promise.reject(new Error('File not found'))
        }
      })
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const entries = await getFilesystemEntries()

      // Should find 1 folder and 2 SQL files
      expect(entries).toHaveLength(3)

      const folders = entries.filter((e) => e.type === 'folder')
      const files = entries.filter((e) => e.type === 'file')

      expect(folders).toHaveLength(1)
      expect(folders[0].name).toBe('folder1')
      expect(folders[0].folderId).toBe(null) // Folders are always at root level

      expect(files).toHaveLength(2)
      const rootFile = files.find((f) => f.name === 'root-snippet')
      const folderFile = files.find((f) => f.name === 'folder1-snippet')

      expect(rootFile?.folderId).toBe(null)
      expect(folderFile?.folderId).toBe(generateDeterministicUuid(['folder1']))
    })

    it('should skip subdirectories inside folders (not supported)', async () => {
      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      const mainDirItems = [createMockDirent('folder1', true)]
      const folder1Items = [
        createMockDirent('snippet.sql', false),
        createMockDirent('subfolder', true), // This should be skipped
      ]

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve(mainDirItems as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'folder1')) {
          return Promise.resolve(folder1Items as any)
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM table;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const entries = await getFilesystemEntries()

      // Should only find 1 folder and 1 file (subfolder should be skipped)
      expect(entries).toHaveLength(2)
      expect(entries.filter((e) => e.type === 'folder')).toHaveLength(1)
      expect(entries.filter((e) => e.type === 'file')).toHaveLength(1)
    })

    it('should handle empty SQL files', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'empty.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const entries = await getFilesystemEntries()

      expect(entries).toHaveLength(1)
      expect(entries[0].content).toBe('')
    })

    it('should handle file read errors gracefully', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'error.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockRejectedValue(new Error('Permission denied'))

      await expect(getFilesystemEntries()).rejects.toThrow('Permission denied')
    })

    it('should handle mkdir failure', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory not found'))
      mockedFS.mkdir.mockRejectedValue(new Error('Permission denied'))

      await expect(getFilesystemEntries()).rejects.toThrow('Permission denied')
    })
  })

  describe('getSnippet', () => {
    it('should get a specific snippet by id', async () => {
      const snippetName = 'test-snippet'
      const snippetId = generateDeterministicUuid([`${snippetName}.sql`])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const snippet = await getSnippet(snippetId)

      // The snippet ID is generated from the full filename in buildSnippet
      expect(snippet.id).toBe(generateDeterministicUuid([`${snippetName}.sql`]))
      expect(snippet.name).toBe(snippetName)
      expect(snippet.content.sql).toBe('SELECT * FROM test;')
      expect(snippet.folder_id).toBe(null)
    })

    it('should get a snippet from a folder', async () => {
      const folderName = 'my-folder'
      const folderId = generateDeterministicUuid([folderName])
      const snippetName = 'folder-snippet'
      const snippetId = generateDeterministicUuid([folderId, `${snippetName}.sql`])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([createMockDirent(folderName, true)] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, folderName)) {
          return Promise.resolve([createMockDirent(`${snippetName}.sql`, false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder_table;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const snippet = await getSnippet(snippetId)

      expect(snippet.id).toBe(generateDeterministicUuid([folderId, `${snippetName}.sql`]))
      expect(snippet.name).toBe(snippetName)
      expect(snippet.content.sql).toBe('SELECT * FROM folder_table;')
      expect(snippet.folder_id).toBe(generateDeterministicUuid(['my-folder']))
    })

    it('should throw error when snippet not found', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(getSnippet('non-existent-id')).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })
  })

  describe('getSnippets', () => {
    it('should get all snippets from root folder', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet2.sql', isDirectory: () => false, isFile: () => true },
        { name: 'folder1', isDirectory: () => true, isFile: () => false },
      ] as any)
      mockedFS.readFile
        .mockResolvedValueOnce('SELECT * FROM table1;')
        .mockResolvedValueOnce('SELECT * FROM table2;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ folderId: null, sort: 'name', sortOrder: 'asc' })

      expect(result.snippets).toHaveLength(2)
      expect(result.snippets[0].name).toBe('snippet1')
      expect(result.snippets[1].name).toBe('snippet2')
      expect(result.snippets[0].folder_id).toBe(null)
      expect(result.snippets[1].folder_id).toBe(null)
      expect(result.cursor).toBeUndefined()
    })

    it('should get snippets from a specific folder', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([createMockDirent('my-folder', true)] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'my-folder')) {
          return Promise.resolve([createMockDirent('folder-snippet.sql', false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder_table;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ folderId })

      expect(result.snippets).toHaveLength(1)
      expect(result.snippets[0].name).toBe('folder-snippet')
      expect(result.snippets[0].folder_id).toBe(folderId)
    })

    it('should return empty result when no snippets in folder', async () => {
      const folderId = generateDeterministicUuid(['empty-folder'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      const result = await getSnippets({ folderId })

      expect(result.snippets).toEqual([])
      expect(result.cursor).toBeUndefined()
    })

    it('should filter snippets by search term across all folders', async () => {
      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([
            createMockDirent('user-query.sql', false),
            createMockDirent('admin-report.sql', false),
            createMockDirent('test-user-data.sql', false),
            createMockDirent('my-folder', true),
          ] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'my-folder')) {
          return Promise.resolve([createMockDirent('user-permissions.sql', false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockImplementation((filePath: any) => {
        const fileName = path.basename(filePath as string)
        return Promise.resolve(`SELECT * FROM ${fileName.replace('.sql', '')};`)
      })
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ searchTerm: 'user', sort: 'name', sortOrder: 'asc' })

      expect(result.snippets).toHaveLength(3)
      expect(result.snippets.map((s) => s.name)).toEqual([
        'test-user-data',
        'user-permissions',
        'user-query',
      ])
    })

    it('should sort snippets by name in ascending order', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'zebra.sql', isDirectory: () => false, isFile: () => true },
        { name: 'apple.sql', isDirectory: () => false, isFile: () => true },
        { name: 'banana.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ sort: 'name', sortOrder: 'asc' })

      expect(result.snippets.map((s) => s.name)).toEqual(['apple', 'banana', 'zebra'])
    })

    it('should sort snippets by name in descending order', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'zebra.sql', isDirectory: () => false, isFile: () => true },
        { name: 'apple.sql', isDirectory: () => false, isFile: () => true },
        { name: 'banana.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ sort: 'name', sortOrder: 'desc' })

      expect(result.snippets.map((s) => s.name)).toEqual(['zebra', 'banana', 'apple'])
    })

    it('should sort snippets by creation date', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'newest.sql', isDirectory: () => false, isFile: () => true },
        { name: 'oldest.sql', isDirectory: () => false, isFile: () => true },
        { name: 'middle.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockImplementation((filePath: any) => {
        const fileName = path.basename(filePath as string)
        switch (fileName) {
          case 'newest.sql':
            return Promise.resolve({ birthtime: new Date('2023-03-01') } as any)
          case 'oldest.sql':
            return Promise.resolve({ birthtime: new Date('2023-01-01') } as any)
          case 'middle.sql':
            return Promise.resolve({ birthtime: new Date('2023-02-01') } as any)
          default:
            return Promise.resolve({ birthtime: new Date('2023-01-01') } as any)
        }
      })

      // Test descending order (newest first - default behavior)
      const resultDesc = await getSnippets({ sort: 'inserted_at', sortOrder: 'desc' })
      expect(resultDesc.snippets.map((s) => s.name)).toEqual(['newest', 'middle', 'oldest'])

      // Test ascending order (oldest first)
      const resultAsc = await getSnippets({ sort: 'inserted_at', sortOrder: 'asc' })
      expect(resultAsc.snippets.map((s) => s.name)).toEqual(['oldest', 'middle', 'newest'])
    })

    it('should paginate results with limit', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet2.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet3.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet4.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ limit: 2, sort: 'name', sortOrder: 'asc' })

      expect(result.snippets).toHaveLength(2)
      expect(result.snippets.map((s) => s.name)).toEqual(['snippet1', 'snippet2'])
      expect(result.cursor).toBeDefined() // Should have a cursor for next page
    })

    it('should use cursor for pagination', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet2.sql', isDirectory: () => false, isFile: () => true },
        { name: 'snippet3.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      // Get first page
      const firstPage = await getSnippets({ limit: 1, sort: 'name', sortOrder: 'asc' })
      expect(firstPage.snippets).toHaveLength(1)
      expect(firstPage.snippets[0].name).toBe('snippet1')
      expect(firstPage.cursor).toBeDefined()

      // Get second page using cursor
      const secondPage = await getSnippets({
        cursor: firstPage.cursor,
        limit: 1,
        sort: 'name',
        sortOrder: 'asc',
      })
      expect(secondPage.snippets).toHaveLength(1)
      expect(secondPage.snippets[0].name).toBe('snippet2')
    })

    it('should handle invalid cursor gracefully', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ cursor: 'invalid-cursor-id' })

      expect(result.snippets).toHaveLength(1) // Should return all snippets
      expect(result.snippets[0].name).toBe('snippet1')
    })

    it('should use default parameters when none provided', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({})

      expect(result.snippets).toHaveLength(1)
      expect(result.cursor).toBeUndefined()
      // Default sort should be by inserted_at desc
    })

    it('should handle empty search term', async () => {
      const folderId = generateDeterministicUuid(['my-folder'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([
            createMockDirent('root-snippet.sql', false),
            createMockDirent('my-folder', true),
          ] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'my-folder')) {
          return Promise.resolve([createMockDirent('folder-snippet.sql', false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      // Empty search term should filter by folderId
      const result = await getSnippets({ searchTerm: '   ', folderId })

      expect(result.snippets).toHaveLength(1)
      expect(result.snippets[0].name).toBe('folder-snippet')
    })

    it('should handle filesystem errors', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory not accessible'))
      mockedFS.mkdir.mockRejectedValue(new Error('Directory not accessible'))

      await expect(getSnippets({})).rejects.toThrow('Directory not accessible')
    })

    it('should return correct snippet structure', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM users;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01T10:00:00Z') } as any)

      const result = await getSnippets({})

      expect(result.snippets).toHaveLength(1)
      const snippet = result.snippets[0]

      expect(snippet).toMatchObject({
        name: 'test-snippet',
        type: 'sql',
        content: {
          sql: 'SELECT * FROM users;',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'johndoe' },
        updated_by: { id: 1, username: 'johndoe' },
      })

      expect(snippet.id).toBeDefined()
      expect(snippet.inserted_at).toBe('2023-01-01T10:00:00.000Z')
      expect(snippet.updated_at).toBe('2023-01-01T10:00:00.000Z')
    })

    it('should perform case-insensitive search', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'USER-query.sql', isDirectory: () => false, isFile: () => true },
        { name: 'admin-report.sql', isDirectory: () => false, isFile: () => true },
        { name: 'Test-User-Data.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ searchTerm: 'user', sort: 'name', sortOrder: 'asc' })

      expect(result.snippets).toHaveLength(2)
      expect(result.snippets.map((s) => s.name)).toEqual(['Test-User-Data', 'USER-query'])
    })

    it('should perform case-insensitive name sorting', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'zebra.sql', isDirectory: () => false, isFile: () => true },
        { name: 'Apple.sql', isDirectory: () => false, isFile: () => true },
        { name: 'banana.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ sort: 'name', sortOrder: 'asc' })

      expect(result.snippets.map((s) => s.name)).toEqual(['Apple', 'banana', 'zebra'])
    })

    it('should validate limit parameter', async () => {
      await expect(getSnippets({ limit: 0 })).rejects.toThrow('Limit must be a positive number')
      await expect(getSnippets({ limit: -5 })).rejects.toThrow('Limit must be a positive number')
      await expect(getSnippets({ limit: 1001 })).rejects.toThrow('Limit cannot exceed 1000')
    })

    it('should handle large valid limit', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'snippet1.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT 1;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await getSnippets({ limit: 1000 })

      expect(result.snippets).toHaveLength(1)
    })
  })

  describe('saveSnippet', () => {
    it('should save a snippet to the filesystem', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'test-snippet',
        description: 'Test snippet',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      // Mock that no existing snippet exists
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'test-snippet.sql'),
        'SELECT * FROM test;',
        'utf-8'
      )
      expect(result.name).toBe('test-snippet')
      expect(result.content.sql).toBe('SELECT * FROM test;')
    })

    it('should handle empty content', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'empty-snippet',
        description: '',
        favorite: false,
        content: {
          sql: '',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'empty-snippet.sql'),
        '',
        'utf-8'
      )
      expect(result.content.sql).toBe('')
    })

    it('should throw error when snippet already exists', async () => {
      const mockSnippet: Snippet = {
        id: generateDeterministicUuid(['existing-snippet.sql']),
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'existing-snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      // Mock that snippet already exists
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM existing;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        `Snippet with id ${mockSnippet.id} already exists`
      )
    })

    it('should save snippet to a folder when folder_id is provided', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'folder-snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM folder_table;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: generateDeterministicUuid(['test-folder']),
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-folder', isDirectory: () => true, isFile: () => false },
      ] as any)
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'test-folder', 'folder-snippet.sql'),
        'SELECT * FROM folder_table;',
        'utf-8'
      )
      expect(result.folder_id).toBe(generateDeterministicUuid(['test-folder']))
    })

    it('should throw error when folder_id is provided but folder does not exist', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'orphan-snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM table;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: 'non-existent-folder-id',
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        'Folder with id non-existent-folder-id not found'
      )
    })

    it('should reject path traversal attempts with ../', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: '../malicious-snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject path traversal attempts with nested directories', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'foo/bar/snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject names with null bytes', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'malicious\0snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject absolute path attempts', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: '/etc/passwd',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(saveSnippet(mockSnippet)).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should allow valid names with special characters', async () => {
      const mockSnippet: Snippet = {
        id: 'test-id',
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'my-snippet_v2 (copy)',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: null,
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const result = await saveSnippet(mockSnippet)

      expect(result.name).toBe('my-snippet_v2 (copy)')
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'my-snippet_v2 (copy).sql'),
        'SELECT * FROM test;',
        'utf-8'
      )
    })
  })

  describe('deleteSnippet', () => {
    it('should delete a snippet file', async () => {
      const snippetId = generateDeterministicUuid(['test-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await deleteSnippet(snippetId)

      expect(mockedFS.unlink).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, `test-snippet.sql`))
    })

    it('should not throw error when file does not exist', async () => {
      const snippetId = generateDeterministicUuid(['test-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')

      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.unlink.mockRejectedValue(error)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(deleteSnippet(snippetId)).resolves.not.toThrow()
    })

    it('should throw error for other filesystem errors', async () => {
      const snippetId = generateDeterministicUuid(['test-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.unlink.mockRejectedValue(error)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(deleteSnippet(snippetId)).rejects.toThrow('Permission denied')
    })

    it('should throw error when snippet not found', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(deleteSnippet('non-existent-id')).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })

    it('should delete a snippet file from a folder', async () => {
      const folderName = 'my-folder'
      const folderId = generateDeterministicUuid([folderName])
      const snippetName = 'folder-snippet'
      const snippetId = generateDeterministicUuid([folderId, `${snippetName}.sql`])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([createMockDirent(folderName, true)] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, folderName)) {
          return Promise.resolve([createMockDirent('folder-snippet.sql', false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder_table;')
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await deleteSnippet(snippetId)

      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'my-folder', 'folder-snippet.sql')
      )
    })
  })

  describe('updateSnippet', () => {
    it('should update an existing snippet', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)

      // First call to getFilesystemEntries - find existing snippet
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)

      // Read the existing snippet content
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { name: 'updated-snippet', content: { sql: 'SELECT * FROM new;' } }

      const result = await updateSnippet(id, updates)

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

    it('should throw error when snippet not found', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(updateSnippet('non-existent-id', {})).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })

    it('should update only provided fields', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      // Mock readdir for both getFilesystemEntries calls (initial and final)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      // Mock readFile for both calls (initial and final)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)
      mockedFS.writeFile.mockResolvedValue(undefined)

      const updates = {
        name: 'new-name',
      }

      const result = await updateSnippet(id, updates)

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })

    it('should move snippet to a folder when folder_id is updated', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])
      const targetFolderId = generateDeterministicUuid(['target-folder'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      // Mock existing snippet in root directory
      mockedFS.access.mockResolvedValue(undefined)

      // Mock multiple readdir calls - the function calls getFilesystemEntries twice
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([
            createMockDirent('existing-snippet.sql', false),
            createMockDirent('target-folder', true),
          ] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'target-folder')) {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { folder_id: targetFolderId }

      const result = await updateSnippet(id, updates)

      // Should write to the folder path
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'target-folder', 'existing-snippet.sql'),
        'SELECT * FROM old;',
        'utf-8'
      )
      // Should delete the old file from root
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(targetFolderId)
    })

    it('should move snippet from folder to root when folder_id is set to null', async () => {
      const folderName = 'source-folder'
      const folderId = generateDeterministicUuid([folderName])
      const id = generateDeterministicUuid([folderId, 'existing-snippet.sql'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)

      // Mock existing snippet in a folder - the function expects the snippet to have folder_id set
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([createMockDirent(folderName, true)] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, folderName)) {
          return Promise.resolve([createMockDirent('existing-snippet.sql', false)] as any)
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { folder_id: null }

      const result = await updateSnippet(id, updates)

      // Should write to the root path
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql'),
        'SELECT * FROM folder;',
        'utf-8'
      )
      // Should delete the old file from folder
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'source-folder', 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(null)
    })

    it('should throw error when trying to move to non-existent folder', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])
      const nonExistentFolderId = 'non-existent-folder-id'

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM table;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { folder_id: nonExistentFolderId }

      await expect(updateSnippet(id, updates)).rejects.toThrow(
        `Folder with id ${nonExistentFolderId} not found`
      )
    })

    it('should handle renaming snippet while moving to folder', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])
      const targetFolderId = generateDeterministicUuid(['target-folder'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([
            createMockDirent('existing-snippet.sql', false),
            createMockDirent('target-folder', true),
          ] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'target-folder')) {
          return Promise.resolve([])
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = {
        name: 'renamed-snippet',
        folder_id: targetFolderId,
        content: { sql: 'SELECT * FROM new;' },
      }

      const result = await updateSnippet(id, updates as any)

      // Should write to the folder path with new name
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'target-folder', 'renamed-snippet.sql'),
        'SELECT * FROM new;',
        'utf-8'
      )
      // Should delete the old file from root with old name
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(result.name).toBe('renamed-snippet')
      expect(result.folder_id).toBe(targetFolderId)
      expect(result.content.sql).toBe('SELECT * FROM new;')
    })

    it('should update content to empty string', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { content: { sql: '' } }

      const result = await updateSnippet(id, updates as any)

      expect(result.content.sql).toBe('')
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql'),
        '',
        'utf-8'
      )
    })

    it('should handle old file deletion errors other than ENOENT', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.unlink.mockRejectedValue(error)

      const updates = { name: 'new-name' }

      await expect(updateSnippet(id, updates)).rejects.toThrow('Permission denied')
    })

    it('should continue when old file deletion fails with ENOENT', async () => {
      const id = generateDeterministicUuid(['existing-snippet.sql'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.unlink.mockRejectedValue(error)

      const updates = { name: 'new-name' }

      const result = await updateSnippet(id, updates)

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })

    it('should throw error when moving snippet to folder that already contains snippet with same name', async () => {
      const snippetName = 'existing-snippet'
      const existingSnippetId = generateDeterministicUuid([`${snippetName}.sql`])
      const targetFolderId = generateDeterministicUuid(['target-folder'])

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)

      // Mock filesystem structure with:
      // - existing-snippet.sql in root
      // - target-folder/ with existing-snippet.sql inside
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([
            createMockDirent('existing-snippet.sql', false),
            createMockDirent('target-folder', true),
          ] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'target-folder')) {
          return Promise.resolve([createMockDirent(`${snippetName}.sql`, false)] as any)
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM table;')
      mockedFS.unlink.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const updates = { folder_id: targetFolderId }

      await expect(updateSnippet(existingSnippetId, updates)).rejects.toThrow(
        `Snippet named "${snippetName}" already exists in the specified folder`
      )
    })
  })

  describe('getFolders', () => {
    it('should read directories from the snippets folder', async () => {
      const mockDirents = [
        { name: 'folder1', isDirectory: () => true, isFile: () => false },
        { name: 'folder2', isDirectory: () => true, isFile: () => false },
        { name: 'snippet.sql', isDirectory: () => false, isFile: () => true },
      ]

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir
        .mockResolvedValueOnce(mockDirents as any) // First call for getFilesystemEntries
        .mockResolvedValueOnce([]) // folder1 contents (empty)
        .mockResolvedValueOnce([]) // folder2 contents (empty)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const folders = await getFolders()

      expect(folders).toHaveLength(2)
      expect(folders[0].name).toBe('folder1')
      expect(folders[1].name).toBe('folder2')
      expect(folders[0].id).toBe(generateDeterministicUuid(['folder1']))
      expect(folders[1].id).toBe(generateDeterministicUuid(['folder2']))
    })

    it('should return empty array when no directories exist', async () => {
      const mockDirents = [{ name: 'snippet.sql', isDirectory: () => false, isFile: () => true }]

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      const folders = await getFolders()

      expect(folders).toEqual([])
    })

    it('should handle directory creation when it does not exist', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.readdir.mockResolvedValue([])

      const folders = await getFolders()

      expect(folders).toEqual([])
    })
  })

  describe('createFolder', () => {
    it('should create a new folder as an actual directory', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([]) // No existing folders
      mockedFS.mkdir.mockResolvedValue(undefined)

      const result = await createFolder('New Folder')

      expect(result.id).toBe(generateDeterministicUuid(['New Folder']))
      expect(result.name).toBe('New Folder')
      expect(result.owner_id).toBe(1)
      expect(mockedFS.mkdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'New Folder'), {
        recursive: true,
      })
    })

    it('should handle folder creation with special characters in name', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.mkdir.mockResolvedValue(undefined)

      const result = await createFolder('Folder with spaces & symbols!')

      expect(result.id).toBe(generateDeterministicUuid(['Folder with spaces & symbols!']))
      expect(result.name).toBe('Folder with spaces & symbols!')
      expect(mockedFS.mkdir).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'Folder with spaces & symbols!'),
        { recursive: true }
      )
    })

    it('should throw error when folder already exists', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Existing Folder', isDirectory: () => true, isFile: () => false },
      ] as any)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(createFolder('Existing Folder')).rejects.toThrow(
        'Folder with name Existing Folder already exists'
      )
    })

    it('should handle mkdir errors', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.mkdir.mockRejectedValue(new Error('Permission denied'))

      await expect(createFolder('New Folder')).rejects.toThrow('Permission denied')
    })

    it('should create directory when snippets directory does not exist', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.readdir.mockResolvedValue([])
      mockedFS.mkdir.mockResolvedValue(undefined)

      const result = await createFolder('New Folder')

      expect(result.name).toBe('New Folder')
      expect(mockedFS.mkdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'New Folder'), {
        recursive: true,
      })
    })

    it('should reject path traversal attempts with ../', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(createFolder('../malicious-folder')).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject path traversal attempts with nested directories', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(createFolder('foo/bar/folder')).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject names with null bytes', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(createFolder('malicious\0folder')).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })

    it('should reject absolute path attempts', async () => {
      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(createFolder('/etc/malicious')).rejects.toThrow(
        'Invalid name: path traversal or null bytes detected'
      )
    })
  })

  describe('deleteFolder', () => {
    it('should delete an existing folder directory', async () => {
      const folderId = generateDeterministicUuid(['Delete Me'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Delete Me', isDirectory: () => true, isFile: () => false, folderId: null },
        { name: 'Keep Me', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)
      mockedFS.rm.mockResolvedValue(undefined)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await deleteFolder(folderId)

      expect(mockedFS.rm).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'Delete Me'), {
        recursive: true,
        force: true,
      })
    })

    it('should throw error when folder not found', async () => {
      const nonExistentId = 'non-existent-folder-id'

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(deleteFolder(nonExistentId)).rejects.toThrow(
        `Folder with id ${nonExistentId} not found`
      )
    })

    it('should handle directory deletion errors gracefully', async () => {
      const folderId = generateDeterministicUuid(['Test Folder'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Test Folder', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.rm.mockRejectedValue(error)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(deleteFolder(folderId)).rejects.toThrow('Permission denied')
    })

    it('should throw original error when directory does not exist during deletion', async () => {
      const folderId = generateDeterministicUuid(['Test Folder'])

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Test Folder', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)

      const error = new Error('Directory not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.rm.mockRejectedValue(error)
      mockedFS.stat.mockResolvedValue({ birthtime: new Date('2023-01-01') } as any)

      await expect(deleteFolder(folderId)).rejects.toThrow(`Folder with id ${folderId} not found`)
    })

    it('should handle case when snippets directory needs to be created first', async () => {
      const nonExistentId = 'non-existent-folder-id'

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.readdir.mockResolvedValue([])

      await expect(deleteFolder(nonExistentId)).rejects.toThrow(
        `Folder with id ${nonExistentId} not found`
      )
    })
  })
})
