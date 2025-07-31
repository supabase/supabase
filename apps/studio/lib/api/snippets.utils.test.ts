import fs from 'fs/promises'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFolder,
  deleteFolder,
  deleteSnippet,
  ensureSnippetsDirectory,
  generateDeterministicUuid,
  readAllSnippets,
  readFolders,
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
  })

  describe('ensureSnippetsDirectory', () => {
    it('should not create directory if it already exists', async () => {
      mockedFS.access.mockResolvedValue(undefined)

      await ensureSnippetsDirectory()

      expect(mockedFS.access).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR)
      expect(mockedFS.mkdir).not.toHaveBeenCalled()
    })

    it('should create the snippets directory if it does not exist', async () => {
      const accessError = new Error('Directory not found')
      mockedFS.access.mockRejectedValue(accessError)
      mockedFS.mkdir.mockResolvedValue(undefined)

      await ensureSnippetsDirectory()

      expect(mockedFS.access).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR)
      expect(mockedFS.mkdir).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR, { recursive: true })
    })
  })

  describe('readAllSnippets', () => {
    it('should read and parse SQL files from the snippets directory', async () => {
      const files = [
        {
          name: 'snippet1.sql',
          content: 'SELECT * FROM users;',
        },
        {
          name: 'snippet2.sql',
          content: 'SELECT * FROM posts;',
        },
        {
          name: 'not-sql.txt',
          content: 'This is not a SQL file',
        },
      ]

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(files.map((f) => f.name) as any)
      mockedFS.readFile
        .mockResolvedValueOnce('SELECT * FROM users;')
        .mockResolvedValueOnce('SELECT * FROM posts;')

      const snippets = await readAllSnippets()

      expect(snippets).toHaveLength(2)
      expect(snippets[0].name).toBe('snippet1')
      expect(snippets[0].content.sql).toBe(files[0].content)
      expect(snippets[1].name).toBe('snippet2')
      expect(snippets[1].content.sql).toBe(files[1].content)
      expect(mockedFS.readFile).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when no SQL files exist', async () => {
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(['not-sql.txt'] as any)

      const snippets = await readAllSnippets()

      expect(snippets).toEqual([])
    })

    it('should handle errors when reading directory', async () => {
      const error = new Error('Directory not found')
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockRejectedValue(error)

      await expect(readAllSnippets()).rejects.toThrow('Directory not found')
    })

    it('should recursively read SQL files from subdirectories', async () => {
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
        createMockDirent('folder2', true),
        createMockDirent('not-sql.txt', false),
      ]

      // Mock folder1 contents
      const folder1Items = [
        createMockDirent('folder1-snippet1.sql', false),
        createMockDirent('folder1-snippet2.sql', false),
        createMockDirent('subfolder', true),
      ]

      // Mock folder2 contents
      const folder2Items = [createMockDirent('folder2-snippet.sql', false)]

      // Mock subfolder contents
      const subfolderItems = [createMockDirent('deep-snippet.sql', false)]

      mockedFS.mkdir.mockResolvedValue(undefined)

      // Mock readdir to return different results based on the path
      mockedFS.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === MOCK_SNIPPETS_DIR) {
          return Promise.resolve(mainDirItems as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'folder1')) {
          return Promise.resolve(folder1Items as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'folder2')) {
          return Promise.resolve(folder2Items as any)
        } else if (dirPath === path.join(MOCK_SNIPPETS_DIR, 'folder1', 'subfolder')) {
          return Promise.resolve(subfolderItems as any)
        }
        return Promise.resolve([])
      })

      // Mock readFile to return different content based on the file
      mockedFS.readFile.mockImplementation((filePath: any) => {
        const fileName = path.basename(filePath as string)
        switch (fileName) {
          case 'root-snippet.sql':
            return Promise.resolve('SELECT * FROM root;')
          case 'folder1-snippet1.sql':
            return Promise.resolve('SELECT * FROM folder1_table1;')
          case 'folder1-snippet2.sql':
            return Promise.resolve('SELECT * FROM folder1_table2;')
          case 'folder2-snippet.sql':
            return Promise.resolve('SELECT * FROM folder2_table;')
          case 'deep-snippet.sql':
            return Promise.resolve('SELECT * FROM deep_table;')
          default:
            return Promise.reject(new Error('File not found'))
        }
      })

      const snippets = await readAllSnippets()

      // Should find all 5 SQL files recursively
      expect(snippets).toHaveLength(5)

      // Check that all expected snippets are present
      const snippetNames = snippets.map((s) => s.name).sort()
      expect(snippetNames).toEqual([
        'deep-snippet',
        'folder1-snippet1',
        'folder1-snippet2',
        'folder2-snippet',
        'root-snippet',
      ])

      // Verify content of each snippet
      const rootSnippet = snippets.find((s) => s.name === 'root-snippet')
      expect(rootSnippet?.content.sql).toBe('SELECT * FROM root;')

      const deepSnippet = snippets.find((s) => s.name === 'deep-snippet')
      expect(deepSnippet?.content.sql).toBe('SELECT * FROM deep_table;')

      // Verify readdir was called for each directory
      expect(mockedFS.readdir).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR, { withFileTypes: true })
      expect(mockedFS.readdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'folder1'), {
        withFileTypes: true,
      })
      expect(mockedFS.readdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'folder2'), {
        withFileTypes: true,
      })
      expect(mockedFS.readdir).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'folder1', 'subfolder'),
        { withFileTypes: true }
      )

      // Verify readFile was called for each SQL file
      expect(mockedFS.readFile).toHaveBeenCalledTimes(5)
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

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.writeFile.mockResolvedValue(undefined)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'test-snippet.sql'),
        JSON.stringify('SELECT * FROM test;', null, 2)
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

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.writeFile.mockResolvedValue(undefined)

      const result = await saveSnippet(mockSnippet)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'empty-snippet.sql'),
        JSON.stringify('', null, 2)
      )
      expect(result.content.sql).toBe('')
    })
  })

  describe('deleteSnippet', () => {
    it('should delete a snippet file', async () => {
      mockedFS.unlink.mockResolvedValue(undefined)

      await deleteSnippet('test-id')

      expect(mockedFS.unlink).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'test-id.json'))
    })

    it('should not throw error when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.unlink.mockRejectedValue(error)

      await expect(deleteSnippet('non-existent-id')).resolves.not.toThrow()
    })

    it('should throw error for other filesystem errors', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.unlink.mockRejectedValue(error)

      await expect(deleteSnippet('test-id')).rejects.toThrow('Permission denied')
    })
  })

  describe('updateSnippet', () => {
    it('should update an existing snippet', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(['existing-snippet.sql'] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)

      const updates = { name: 'updated-snippet', content: { sql: 'SELECT * FROM new;' } }

      const result = await updateSnippet(id, updates as any)

      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'updated-snippet.sql'),
        JSON.stringify('SELECT * FROM new;', null, 2)
      )
      expect(result.name).toBe('updated-snippet')
      expect(result.content.sql).toBe('SELECT * FROM new;')
    })

    it('should throw error when snippet not found', async () => {
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue([])

      await expect(updateSnippet('non-existent-id', {})).rejects.toThrow(
        'Snippet with id non-existent-id not found'
      )
    })

    it('should update only provided fields', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(['existing-snippet.sql'] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)

      const updates = {
        name: 'new-name',
      }

      const result = await updateSnippet(id, updates as any)

      expect(result.name).toBe('new-name')
      expect(result.content.sql).toBe('SELECT * FROM old;')
    })

    it('should move snippet to a folder when folder_id is updated', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'
      const targetFolderId = generateDeterministicUuid('target-folder')

      // Mock existing snippet in root directory
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir
        .mockResolvedValueOnce(['existing-snippet.sql'] as any) // for readAllSnippets
        .mockResolvedValueOnce([
          // for readFolders
          { name: 'target-folder', isDirectory: () => true, isFile: () => false },
        ] as any)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM old;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)

      const updates = { folder_id: targetFolderId }

      const result = await updateSnippet(id, updates as any)

      // Should write to the folder path
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'target-folder', 'existing-snippet.sql'),
        JSON.stringify('SELECT * FROM old;', null, 2)
      )
      // Should delete the old file from root
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(targetFolderId)
    })

    it('should move snippet from folder to root when folder_id is set to null', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'
      const sourceFolderId = generateDeterministicUuid('source-folder')

      // Mock existing snippet in a folder
      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.mkdir.mockResolvedValue(undefined)

      // Mock readAllSnippets - snippet is currently in a folder
      mockedFS.readdir
        .mockResolvedValueOnce([
          // Main directory for readAllSnippets
          createMockDirent('source-folder', true),
        ] as any)
        .mockResolvedValueOnce([
          // source-folder contents for readAllSnippets
          createMockDirent('existing-snippet.sql', false),
        ] as any)
        .mockResolvedValueOnce([
          // for readFolders
          { name: 'source-folder', isDirectory: () => true, isFile: () => false },
        ] as any)

      mockedFS.readFile.mockResolvedValue('SELECT * FROM folder;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)

      const updates = { folder_id: null }

      const result = await updateSnippet(id, updates as any)

      // Should write to the root path
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql'),
        JSON.stringify('SELECT * FROM folder;', null, 2)
      )
      // Should delete the old file from folder
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'source-folder', 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(null)
    })

    it('should move snippet between folders', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'
      const sourceFolderId = generateDeterministicUuid('source-folder')
      const targetFolderId = generateDeterministicUuid('target-folder')

      // Mock existing snippet in source folder
      const createMockDirent = (name: string, isDirectory: boolean) => ({
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
      })

      mockedFS.mkdir.mockResolvedValue(undefined)

      // Mock readAllSnippets
      mockedFS.readdir
        .mockResolvedValueOnce([
          // Main directory for readAllSnippets
          createMockDirent('source-folder', true),
          createMockDirent('target-folder', true),
        ] as any)
        .mockResolvedValueOnce([
          // source-folder contents for readAllSnippets
          createMockDirent('existing-snippet.sql', false),
        ] as any)
        .mockResolvedValueOnce([]) // target-folder contents for readAllSnippets (empty)
        .mockResolvedValueOnce([
          // for readFolders
          { name: 'source-folder', isDirectory: () => true, isFile: () => false },
          { name: 'target-folder', isDirectory: () => true, isFile: () => false },
        ] as any)

      mockedFS.readFile.mockResolvedValue('SELECT * FROM source_folder;')
      mockedFS.writeFile.mockResolvedValue(undefined)
      mockedFS.unlink.mockResolvedValue(undefined)

      const updates = { folder_id: targetFolderId }

      const result = await updateSnippet(id, updates as any)

      // Should write to the target folder path
      expect(mockedFS.writeFile).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'target-folder', 'existing-snippet.sql'),
        JSON.stringify('SELECT * FROM source_folder;', null, 2)
      )
      // Should delete the old file from source folder
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'source-folder', 'existing-snippet.sql')
      )
      expect(result.folder_id).toBe(targetFolderId)
    })

    it('should throw error when trying to move to non-existent folder', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'
      const nonExistentFolderId = 'non-existent-folder-id'

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir
        .mockResolvedValueOnce(['existing-snippet.sql'] as any) // for readAllSnippets
        .mockResolvedValueOnce([]) // for readFolders (no folders)
      mockedFS.readFile.mockResolvedValue('SELECT * FROM table;')

      const updates = { folder_id: nonExistentFolderId }

      await expect(updateSnippet(id, updates as any)).rejects.toThrow(
        `Folder with id ${nonExistentFolderId} not found`
      )
    })

    it('should handle renaming snippet while moving to folder', async () => {
      // This id is generated from the snippet name
      const id = 'bfe4c780-f078-4b85-aa31-d46b66d960a4'
      const targetFolderId = generateDeterministicUuid('target-folder')

      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir
        .mockResolvedValueOnce(['existing-snippet.sql'] as any) // for readAllSnippets
        .mockResolvedValueOnce([
          // for readFolders
          { name: 'target-folder', isDirectory: () => true, isFile: () => false },
        ] as any)
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
        JSON.stringify('SELECT * FROM new;', null, 2)
      )
      // Should delete the old file from root with old name
      expect(mockedFS.unlink).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'existing-snippet.sql')
      )
      expect(result.name).toBe('renamed-snippet')
      expect(result.folder_id).toBe(targetFolderId)
      expect(result.content.sql).toBe('SELECT * FROM new;')
    })
  })

  describe('readFolders', () => {
    it('should read directories from the snippets folder', async () => {
      const mockDirents = [
        { name: 'folder1', isDirectory: () => true, isFile: () => false },
        { name: 'folder2', isDirectory: () => true, isFile: () => false },
        { name: 'snippet.sql', isDirectory: () => false, isFile: () => true },
      ]

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

      const folders = await readFolders()

      expect(folders).toHaveLength(2)
      expect(folders[0].name).toBe('folder1')
      expect(folders[1].name).toBe('folder2')
      expect(mockedFS.readdir).toHaveBeenCalledWith(MOCK_SNIPPETS_DIR, { withFileTypes: true })
    })

    it('should return empty array when no directories exist', async () => {
      const mockDirents = [{ name: 'snippet.sql', isDirectory: () => false, isFile: () => true }]

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

      const folders = await readFolders()

      expect(folders).toEqual([])
    })

    it('should handle errors when reading directory', async () => {
      const error = new Error('Permission denied')
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockRejectedValue(error)

      await expect(readFolders()).rejects.toThrow('Permission denied')
    })
  })

  describe('createFolder', () => {
    it('should create a new folder as an actual directory', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)

      const result = await createFolder('New Folder')

      expect(result.id).toBe('c75ba807-4400-4ff6-827c-b4467c118ea6')
      expect(result.name).toBe('New Folder')
      expect(result.owner_id).toBe(1)
      expect(mockedFS.mkdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'New Folder'), {
        recursive: true,
      })
    })

    it('should handle folder creation with special characters in name', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)

      const result = await createFolder('Folder with spaces & symbols!')

      expect(result.id).toBe('0277ae1d-28fd-4488-a2d0-b7c2147bba21')
      expect(result.name).toBe('Folder with spaces & symbols!')
      expect(mockedFS.mkdir).toHaveBeenCalledWith(
        path.join(MOCK_SNIPPETS_DIR, 'Folder with spaces & symbols!'),
        { recursive: true }
      )
    })

    it('should handle mkdir errors', async () => {
      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockRejectedValueOnce(new Error('Permission denied'))
      mockedFS.mkdir.mockResolvedValueOnce(undefined) // For ensureSnippetsDirectory

      await expect(createFolder('New Folder')).rejects.toThrow('Permission denied')
    })
  })

  describe('deleteFolder', () => {
    it('should delete an existing folder directory', async () => {
      // This id is generated from the folder name
      const id = '38672565-09e0-40e6-bf53-79430ea4a3b8'
      const mockDirents = [
        { name: 'Delete Me', isDirectory: () => true, isFile: () => false },
        { name: 'Keep Me', isDirectory: () => true, isFile: () => false },
      ]

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)
      mockedFS.rmdir.mockResolvedValue(undefined)

      await deleteFolder(id)

      expect(mockedFS.rmdir).toHaveBeenCalledWith(path.join(MOCK_SNIPPETS_DIR, 'Delete Me'), {
        recursive: true,
      })
    })

    it('should throw error when folder not found', async () => {
      const mockDirents: any[] = []

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

      await expect(deleteFolder('non-existent-folder')).rejects.toThrow(
        'Folder with id non-existent-folder not found'
      )
    })

    it('should handle directory deletion errors gracefully', async () => {
      const mockDirents = [{ name: 'Test Folder', isDirectory: () => true, isFile: () => false }]

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

      const error = new Error('Permission denied') as NodeJS.ErrnoException
      error.code = 'EACCES'
      mockedFS.rmdir.mockRejectedValue(error)

      await expect(deleteFolder('ab34f4dc-3764-42bd-8fab-e02664f7b7c0')).rejects.toThrow(
        'Permission denied'
      )
    })

    it('should throw original error when directory does not exist', async () => {
      const mockDirents = [{ name: 'Test Folder', isDirectory: () => true, isFile: () => false }]

      mockedFS.access.mockRejectedValue(new Error('Directory does not exist'))
      mockedFS.mkdir.mockResolvedValue(undefined)
      mockedFS.readdir.mockResolvedValue(mockDirents as any)

      const error = new Error('Directory not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockedFS.rmdir.mockRejectedValue(error)

      await expect(deleteFolder('folder-to-delete')).rejects.toThrow(
        'Folder with id folder-to-delete not found'
      )
    })
  })
})
