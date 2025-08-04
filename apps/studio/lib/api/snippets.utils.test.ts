import fs from 'fs/promises'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFolder,
  deleteFolder,
  deleteSnippet,
  generateDeterministicUuid,
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

  describe('generateDeterministicUuid', () => {
    it('should generate the same UUID for the same input', () => {
      const input = 'test-string'
      const uuid1 = generateDeterministicUuid(input)
      const uuid2 = generateDeterministicUuid(input)

      expect(uuid1).toBe(uuid2)
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate different UUIDs for different inputs', () => {
      const uuid1 = generateDeterministicUuid('input1')
      const uuid2 = generateDeterministicUuid('input2')

      expect(uuid1).not.toBe(uuid2)
    })

    it('should handle empty string input', () => {
      const uuid = generateDeterministicUuid('')
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should handle special characters and Unicode', () => {
      const uuid1 = generateDeterministicUuid('test-with-émojis-🚀-and-símb0ls!')
      const uuid2 = generateDeterministicUuid('test-with-émojis-🚀-and-símb0ls!')
      expect(uuid1).toBe(uuid2)
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const uuid = generateDeterministicUuid(longString)
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
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
      expect(folderFile?.folderId).toBe(generateDeterministicUuid('folder1'))
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
      const snippetId = generateDeterministicUuid(snippetName)

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')

      const snippet = await getSnippet(snippetId)

      // The snippet ID is generated from the full filename in buildSnippet
      expect(snippet.id).toBe(generateDeterministicUuid(snippetName))
      expect(snippet.name).toBe(snippetName)
      expect(snippet.content.sql).toBe('SELECT * FROM test;')
      expect(snippet.folder_id).toBe(null)
    })

    it('should get a snippet from a folder', async () => {
      const snippetName = 'folder-snippet'
      const snippetId = generateDeterministicUuid(snippetName)

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
          return Promise.resolve([createMockDirent(`${snippetName}.sql`, false)] as any)
        }
        return Promise.resolve([])
      })
      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder_table;')

      const snippet = await getSnippet(snippetId)

      expect(snippet.id).toBe(generateDeterministicUuid(snippetName))
      expect(snippet.name).toBe(snippetName)
      expect(snippet.content.sql).toBe('SELECT * FROM folder_table;')
      expect(snippet.folder_id).toBe(generateDeterministicUuid('my-folder'))
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

      const snippets = await getSnippets(null)

      expect(snippets).toHaveLength(2)
      expect(snippets[0].name).toBe('snippet1')
      expect(snippets[1].name).toBe('snippet2')
      expect(snippets[0].folder_id).toBe(null)
      expect(snippets[1].folder_id).toBe(null)
    })

    it('should get snippets from a specific folder', async () => {
      const folderId = generateDeterministicUuid('my-folder')

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

      const snippets = await getSnippets(folderId)

      expect(snippets).toHaveLength(1)
      expect(snippets[0].name).toBe('folder-snippet')
      expect(snippets[0].folder_id).toBe(folderId)
    })

    it('should return empty array when no snippets in folder', async () => {
      const folderId = generateDeterministicUuid('empty-folder')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      const snippets = await getSnippets(folderId)

      expect(snippets).toEqual([])
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
          favorite: false,
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
          favorite: false,
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
        id: generateDeterministicUuid('existing-snippet'),
        inserted_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        type: 'sql',
        name: 'existing-snippet',
        description: '',
        favorite: false,
        content: {
          sql: 'SELECT * FROM test;',
          favorite: false,
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
          favorite: false,
          content_id: 'content-id',
          schema_version: '1.0',
        },
        visibility: 'user',
        project_id: 1,
        folder_id: generateDeterministicUuid('test-folder'),
        owner_id: 1,
        owner: { id: 1, username: 'testuser' },
        updated_by: { id: 1, username: 'testuser' },
      }

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-folder', isDirectory: () => true, isFile: () => false },
      ] as any)
      mockedFS.writeFile.mockResolvedValue(undefined)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'test-folder', 'folder-snippet.sql'),
        'SELECT * FROM folder_table;',
        'utf-8'
      )
      expect(result.folder_id).toBe(generateDeterministicUuid('test-folder'))
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
          favorite: false,
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
  })

  describe('deleteSnippet', () => {
    it('should delete a snippet file', async () => {
      const snippetId = generateDeterministicUuid('test-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')
      mockedFS.unlink.mockResolvedValue(undefined)

      await deleteSnippet(snippetId)

      // BUG: The implementation incorrectly tries to delete a .json file
      // but snippets are stored as .sql files
      expect(mockedFS.unlink).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, `test-snippet.sql`))
    })

    it('should not throw error when file does not exist', async () => {
      const snippetId = generateDeterministicUuid('test-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')

      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.unlink.mockRejectedValue(error)

      await expect(deleteSnippet(snippetId)).resolves.not.toThrow()
    })

    it('should throw error for other filesystem errors', async () => {
      const snippetId = generateDeterministicUuid('test-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'test-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM test;')

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.unlink.mockRejectedValue(error)

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
      const snippetName = 'folder-snippet'
      const snippetId = generateDeterministicUuid(snippetName)

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
      mockedFS.unlink.mockResolvedValue(undefined)

      await deleteSnippet(snippetId)

      // BUG: The implementation incorrectly tries to delete a .json file
      // but should delete the actual .sql file from the folder
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'my-folder', 'folder-snippet.sql')
      )

      // TODO: The implementation should actually delete:
      // path.join(MOCK_SNIPPETS_DIR, 'my-folder', 'folder-snippet.sql')
    })
  })

  describe('updateSnippet', () => {
    it('should update an existing snippet', async () => {
      const id = generateDeterministicUuid('existing-snippet')

      mockedFS.access.mockResolvedValue(undefined)

      // First call to getFilesystemEntries - find existing snippet
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)

      // Read the existing snippet content
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')

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
      const id = generateDeterministicUuid('existing-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      // // Mock readdir for both getFilesystemEntries calls (initial and final)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      // // Mock readFile for both calls (initial and final)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      // mockedFS.writeFile.mockResolvedValue(undefined)

      const updates = {
        name: 'new-name',
      }

      const result = await updateSnippet(id, updates)

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })

    it('should move snippet to a folder when folder_id is updated', async () => {
      const id = generateDeterministicUuid('existing-snippet')
      const targetFolderId = generateDeterministicUuid('target-folder')

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
      const id = generateDeterministicUuid('existing-snippet')

      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.access.mockResolvedValue(undefined)

      // Mock existing snippet in a folder - the function expects the snippet to have folder_id set
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve([createMockDirent('source-folder', true)] as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'source-folder')) {
          return Promise.resolve([createMockDirent('existing-snippet.sql', false)] as any)
        }
        return Promise.resolve([])
      })

      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)

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
      const id = generateDeterministicUuid('existing-snippet')
      const nonExistentFolderId = 'non-existent-folder-id'

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM table;')

      const updates = { folder_id: nonExistentFolderId }

      await expect(updateSnippet(id, updates)).rejects.toThrow(
        `Folder with id ${nonExistentFolderId} not found`
      )
    })

    it('should handle renaming snippet while moving to folder', async () => {
      const id = generateDeterministicUuid('existing-snippet')
      const targetFolderId = generateDeterministicUuid('target-folder')

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
      const id = generateDeterministicUuid('existing-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)

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
      const id = generateDeterministicUuid('existing-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.unlink.mockRejectedValue(error)

      const updates = { name: 'new-name' }

      await expect(updateSnippet(id, updates)).rejects.toThrow('Permission denied')
    })

    it('should continue when old file deletion fails with ENOENT', async () => {
      const id = generateDeterministicUuid('existing-snippet')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'existing-snippet.sql', isDirectory: () => false, isFile: () => true },
      ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)

      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.unlink.mockRejectedValue(error)

      const updates = { name: 'new-name' }

      const result = await updateSnippet(id, updates)

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
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

      const folders = await getFolders()

      expect(folders).toHaveLength(2)
      expect(folders[0].name).toBe('folder1')
      expect(folders[1].name).toBe('folder2')
      expect(folders[0].id).toBe(generateDeterministicUuid('folder1'))
      expect(folders[1].id).toBe(generateDeterministicUuid('folder2'))
    })

    it('should return empty array when no directories exist', async () => {
      const mockDirents = [{ name: 'snippet.sql', isDirectory: () => false, isFile: () => true }]

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

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

      expect(result.id).toBe(generateDeterministicUuid('New Folder'))
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

      expect(result.id).toBe(generateDeterministicUuid('Folder with spaces & symbols!'))
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
  })

  describe('deleteFolder', () => {
    it('should delete an existing folder directory', async () => {
      const folderId = generateDeterministicUuid('Delete Me')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Delete Me', isDirectory: () => true, isFile: () => false, folderId: null },
        { name: 'Keep Me', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)
      mockedFS.rmdir.mockResolvedValue(undefined)

      await deleteFolder(folderId)

      expect(mockedFS.rmdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'Delete Me'), {
        recursive: true,
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
      const folderId = generateDeterministicUuid('Test Folder')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Test Folder', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.rmdir.mockRejectedValue(error)

      await expect(deleteFolder(folderId)).rejects.toThrow('Permission denied')
    })

    it('should throw original error when directory does not exist during deletion', async () => {
      const folderId = generateDeterministicUuid('Test Folder')

      mockedFS.access.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([
        { name: 'Test Folder', isDirectory: () => true, isFile: () => false, folderId: null },
      ] as any)

      const error = new Error('Directory not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.rmdir.mockRejectedValue(error)

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
