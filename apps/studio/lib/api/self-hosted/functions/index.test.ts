import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as util from '../util'
import * as fileSystemStore from './fileSystemStore'
import {
  getFunctionsArtifactStore,
  getSelfHostedVerifyJwt,
  mapArtifactToFunctionResponse,
} from './index'
import { FunctionArtifact } from './types'

vi.mock('../util', () => ({
  assertSelfHosted: vi.fn(),
}))

vi.mock('./fileSystemStore', () => ({
  FileSystemFunctionsArtifactStore: vi.fn(),
}))

describe('api/self-hosted/functions/index', () => {
  let originalEdgeFunctionsFolder: string | undefined
  let originalVerifyJwt: string | undefined

  beforeEach(() => {
    originalEdgeFunctionsFolder = process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER
    originalVerifyJwt = process.env.FUNCTIONS_VERIFY_JWT
    vi.resetAllMocks()
  })

  afterEach(() => {
    if (originalEdgeFunctionsFolder !== undefined) {
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = originalEdgeFunctionsFolder
    } else {
      delete process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER
    }
    if (originalVerifyJwt !== undefined) {
      process.env.FUNCTIONS_VERIFY_JWT = originalVerifyJwt
    } else {
      delete process.env.FUNCTIONS_VERIFY_JWT
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
      vi.mocked(fileSystemStore.FileSystemFunctionsArtifactStore).mockImplementation(function () {
        return mockInstance as any
      })
      process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER = '/tmp/test'

      const result = getFunctionsArtifactStore()

      expect(result).toBe(mockInstance)
    })
  })

  describe('getSelfHostedVerifyJwt', () => {
    it('returns true only when FUNCTIONS_VERIFY_JWT is exactly "true"', () => {
      process.env.FUNCTIONS_VERIFY_JWT = 'true'
      expect(getSelfHostedVerifyJwt()).toBe(true)
    })

    it('returns false when FUNCTIONS_VERIFY_JWT is "false"', () => {
      process.env.FUNCTIONS_VERIFY_JWT = 'false'
      expect(getSelfHostedVerifyJwt()).toBe(false)
    })

    it('returns false when FUNCTIONS_VERIFY_JWT is unset', () => {
      delete process.env.FUNCTIONS_VERIFY_JWT
      expect(getSelfHostedVerifyJwt()).toBe(false)
    })
  })

  describe('mapArtifactToFunctionResponse', () => {
    const artifact: FunctionArtifact = {
      slug: 'health',
      entrypoint_path: 'file:///app/edge-functions/health/index.ts',
      created_at: 1000,
      updated_at: 2000,
    }

    it('maps artifact fields onto the function response shape', () => {
      delete process.env.FUNCTIONS_VERIFY_JWT
      expect(mapArtifactToFunctionResponse(artifact)).toMatchObject({
        slug: 'health',
        name: 'health',
        status: 'ACTIVE',
        entrypoint_path: artifact.entrypoint_path,
        created_at: 1000,
        updated_at: 2000,
      })
    })

    it('derives verify_jwt from FUNCTIONS_VERIFY_JWT', () => {
      process.env.FUNCTIONS_VERIFY_JWT = 'true'
      expect(mapArtifactToFunctionResponse(artifact).verify_jwt).toBe(true)

      process.env.FUNCTIONS_VERIFY_JWT = 'false'
      expect(mapArtifactToFunctionResponse(artifact).verify_jwt).toBe(false)
    })
  })
})
