import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as util from '../util'
import * as fileSystemStore from './fileSystemStore'
import { getFunctionsArtifactStore } from './index'

vi.mock('../util', () => ({
  assertSelfHosted: vi.fn(),
}))

vi.mock('./fileSystemStore', () => ({
  FileSystemFunctionsArtifactStore: vi.fn(),
}))

describe('api/self-hosted/functions/index', () => {
  let originalEdgeFunctionsFolder: string | undefined

  beforeEach(() => {
    originalEdgeFunctionsFolder = process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER
    vi.resetAllMocks()
  })

  afterEach(() => {
    if (originalEdgeFunctionsFolder !== undefined) {
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = originalEdgeFunctionsFolder
    } else {
      delete process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER
    }
  })

  describe('getFunctionsArtifactStore', () => {
    it('should call assertSelfHosted', () => {
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = '/tmp/functions'

      getFunctionsArtifactStore()

      expect(util.assertSelfHosted).toHaveBeenCalled()
    })

    it('should throw error if EDGE_FUNCTIONS_MANAGEMENT_FOLDER is not set', () => {
      delete process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER

      expect(() => getFunctionsArtifactStore()).toThrow(
        'EDGE_FUNCTIONS_MANAGEMENT_FOLDER is required'
      )
    })

    it('should create FileSystemFunctionsArtifactStore with correct path', () => {
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = '/var/lib/functions'

      getFunctionsArtifactStore()

      expect(fileSystemStore.FileSystemFunctionsArtifactStore).toHaveBeenCalledWith(
        '/var/lib/functions'
      )
    })

    it('should return FileSystemFunctionsArtifactStore instance', () => {
      const mockInstance = {
        folderPath: '/tmp/test',
        getFunctions: vi.fn(),
        getFunctionBySlug: vi.fn(),
        getFileEntriesBySlug: vi.fn(),
      }
      vi.mocked(fileSystemStore.FileSystemFunctionsArtifactStore).mockReturnValue(
        mockInstance as any
      )
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = '/tmp/test'

      const result = getFunctionsArtifactStore()

      expect(result).toBe(mockInstance)
    })
  })
})
