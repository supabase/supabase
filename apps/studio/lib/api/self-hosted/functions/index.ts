import assert from 'node:assert'

import type { components } from 'api-types'

import { assertSelfHosted } from '../util'
import { FileSystemFunctionsArtifactStore } from './fileSystemStore'
import { FunctionArtifact } from './types'
import { uuidv4 } from '@/lib/helpers'

type FunctionResponse = components['schemas']['FunctionResponse']

export function getFunctionsArtifactStore() {
  assertSelfHosted()
  assert(
    process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER,
    'EDGE_FUNCTIONS_MANAGEMENT_FOLDER is required'
  )

  return new FileSystemFunctionsArtifactStore(process.env.EDGE_FUNCTIONS_MANAGEMENT_FOLDER)
}

/**
 * Self-hosted edge functions don't persist per-function metadata, so JWT verification is a single
 * global setting controlled by `FUNCTIONS_VERIFY_JWT` (mapped to the edge-runtime's `VERIFY_JWT`).
 * It only reports verification as enabled when explicitly set to `true`, matching the shipped
 * default (`FUNCTIONS_VERIFY_JWT=false` in `docker/.env.example`).
 */
export function getSelfHostedVerifyJwt() {
  return process.env.FUNCTIONS_VERIFY_JWT === 'true'
}

/** Maps a self-hosted function artifact (read from disk) to the management API's response shape. */
export function mapArtifactToFunctionResponse(artifact: FunctionArtifact): FunctionResponse {
  return {
    id: uuidv4(),
    slug: artifact.slug,
    version: 1,
    name: artifact.slug,
    status: 'ACTIVE',
    entrypoint_path: artifact.entrypoint_path,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
    verify_jwt: getSelfHostedVerifyJwt(),
  }
}
