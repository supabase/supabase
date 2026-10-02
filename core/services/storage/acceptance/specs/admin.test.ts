import { randomUUID } from 'node:crypto'
import { ListBucketsCommand } from '@aws-sdk/client-s3'
import {
  describeAcceptance,
  encodePathSegments,
  getAcceptanceConfig,
  requireConfigValue,
} from '../support/config'
import { AcceptanceHttpClient, createAdminClient, createRestClient } from '../support/http'
import {
  cleanupRestResources,
  createRestBucket,
  requireServiceKey,
  uniqueBucketName,
  uniqueObjectKey,
  uploadRestObject,
} from '../support/resources'
import { createAcceptanceS3Client } from '../support/s3'
import { isUuid } from '../support/validation'

interface TenantSummary {
  fileSizeLimit?: number
  id: string
}

interface TenantFeatures {
  icebergCatalog?: {
    enabled?: boolean
    maxCatalogs?: number | null
    maxNamespaces?: number | null
    maxTables?: number | null
  }
  imageTransformation?: {
    enabled?: boolean
    maxResolution?: number | null
  }
  purgeCache?: {
    enabled?: boolean
  }
  s3Protocol?: {
    enabled?: boolean
  }
  vectorBuckets?: {
    enabled?: boolean
    maxBuckets?: number | null
    maxIndexes?: number | null
  }
}

interface TenantDetailResponse {
  anonKey?: string
  capabilities?: Record<string, unknown>
  databasePoolUrl?: string | null
  databaseUrl?: string
  fileSizeLimit?: number
  features?: TenantFeatures
  jwtSecret?: string
  maxConnections?: number
  migrationStatus?: string | null
  migrationVersion?: string | null
  serviceKey?: string
}

interface TenantMigrationResponse {
  isLatest?: boolean
  migrationsStatus?: string | null
  migrationsVersion?: string | null
}

interface TenantHealthResponse {
  healthy: boolean
}

interface MessageResponse {
  message?: string
}

interface TenantMigrationRunResponse {
  migrated?: boolean
}

interface S3CredentialResponse {
  access_key: string
  description: string
  id: string
  secret_key: string
}

interface S3CredentialListItem {
  description?: string
  id: string
}

interface JwksAddResponse {
  kid: string
}

interface JwksToggleResponse {
  result: boolean
}

interface JwksListItem {
  active: boolean
  kid: string
  kind: string
  type: string
}

interface SignedUrlResponse {
  signedURL: string
}

interface WellKnownJwksResponse {
  keys: Array<Record<string, unknown>>
}

const STORAGE_URL_SIGNING_KIND = 'storage-url-signing-key'

describeAcceptance(
  'admin API contract',
  {
    destructive: true,
    profiles: ['full'],
    requires: ['admin'],
  },
  () => {
    it('covers tenant reads, migration and queue validation, JWKS validation, orphan validation, and S3 credential CRUD', async () => {
      const config = getAcceptanceConfig()
      const client = createAdminClient()
      const headers = {
        apikey: requireConfigValue(config.adminApiKey, 'ACCEPTANCE_ADMIN_API_KEY'),
      }
      const tenantId = await resolveTenantId(client, headers)
      const credentialDescription = `acceptance-${config.runId}`
      const credentialIds = new Set<string>()
      const jwkKind = `acceptance-${config.runId}`.slice(0, 50)
      const jwkKids = new Set<string>()

      try {
        const tenant = await client.request<TenantDetailResponse>('GET', `/tenants/${tenantId}`, {
          expectedStatus: 200,
          headers,
        })
        expect(tenant.json?.features).toBeTruthy()
        expect(tenant.json?.capabilities).toBeTruthy()

        const migrations = await client.request('GET', `/tenants/${tenantId}/migrations`, {
          expectedStatus: 200,
          headers,
        })
        expect(migrations.json).toBeTruthy()

        await client.request('GET', '/migrations/failed?cursor=not-a-number', {
          expectedStatus: 400,
          headers,
        })

        await client.request('POST', '/migrations/reset/fleet', {
          body: {
            untilMigration: 'not-a-migration',
          },
          expectedStatus: 400,
          headers,
        })

        await client.request('POST', '/queue/move', {
          body: {},
          expectedStatus: 400,
          headers,
        })

        await client.request('POST', `/tenants/${tenantId}/jwks`, {
          body: {
            jwk: {
              kty: 'unsupported',
            },
            kind: 'acceptance_invalid',
          },
          expectedStatus: 400,
          headers,
        })

        const jwksStatus = await client.request('GET', '/tenants/jwks/generate-all-missing', {
          expectedStatus: 200,
          headers,
        })
        expect(jwksStatus.json).toBeTruthy()

        const jwk = await client.request<JwksAddResponse>('POST', `/tenants/${tenantId}/jwks`, {
          body: {
            jwk: {
              kty: 'oct',
              k: 'nrRW40eXW1wEzzqhsyIRieFZNrUA59sowrTTWLzPJks',
            },
            kind: jwkKind,
          },
          expectedStatus: 201,
          headers,
        })
        const jwkKid = jwk.json?.kid
        if (typeof jwkKid !== 'string' || jwkKid.length === 0) {
          throw new Error('Admin JWKS create response did not include a non-empty kid')
        }
        expect(isUuid(jwkKid)).toBe(true)
        jwkKids.add(jwkKid)

        const disabledJwk = await client.request<JwksToggleResponse>(
          'PUT',
          `/tenants/${tenantId}/jwks/${jwkKid}`,
          {
            body: {
              active: false,
            },
            expectedStatus: 200,
            headers,
          }
        )
        expect(disabledJwk.json?.result).toBe(true)

        await client.request(
          'GET',
          `/tenants/${tenantId}/buckets/acceptance-nonexistent/orphan-objects?before=not-a-date`,
          {
            expectedStatus: 400,
            headers,
          }
        )

        await client.request(
          'DELETE',
          `/tenants/${tenantId}/buckets/acceptance-nonexistent/orphan-objects`,
          {
            body: {
              deleteDbKeys: false,
              deleteS3Keys: false,
            },
            expectedStatus: 400,
            headers,
          }
        )

        const orphanSync = await client.request(
          'DELETE',
          `/tenants/${tenantId}/buckets/acceptance-nonexistent/orphan-objects`,
          {
            body: {
              before: new Date(Date.now() + 1_000).toISOString(),
              deleteS3Keys: true,
            },
            expectedStatus: 200,
            headers,
          }
        )
        expect(orphanSync.headers.get('content-type') ?? 'application/x-ndjson').toContain(
          'application/x-ndjson'
        )
        expect(orphanSync.body).not.toContain('"event":"error"')

        const credential = await client.request<S3CredentialResponse>(
          'POST',
          `/s3/${tenantId}/credentials`,
          {
            body: {
              claims: {
                role: 'service_role',
                sub: `acceptance-${config.runId}`,
              },
              description: credentialDescription,
            },
            expectedStatus: 201,
            headers,
          }
        )
        const credentialId = credential.json?.id
        expect(credential.json?.access_key).toBeTruthy()
        expect(credential.json?.secret_key).toBeTruthy()
        expect(credentialId).toBeTruthy()
        if (!credentialId) {
          throw new Error('Admin S3 credential response did not include an id')
        }
        credentialIds.add(credentialId)

        const accessKeyId = credential.json?.access_key
        const secretAccessKey = credential.json?.secret_key
        if (!accessKeyId || !secretAccessKey) {
          throw new Error('Admin S3 credential response did not include access and secret keys')
        }

        const credentialClient = createAcceptanceS3Client({
          accessKeyId,
          secretAccessKey,
        })
        try {
          await expect(credentialClient.send(new ListBucketsCommand({}))).resolves.toBeTruthy()
        } finally {
          credentialClient.destroy()
        }

        const credentials = await client.request<S3CredentialListItem[]>(
          'GET',
          `/s3/${tenantId}/credentials`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(credentials.json?.map((item) => item.id)).toContain(credentialId)

        await client.request('DELETE', `/s3/${tenantId}/credentials`, {
          body: {
            id: credentialId,
          },
          expectedStatus: 204,
          headers,
        })
        credentialIds.delete(credentialId)

        const credentialsAfterDelete = await client.request<S3CredentialListItem[]>(
          'GET',
          `/s3/${tenantId}/credentials`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(credentialsAfterDelete.json?.map((item) => item.id)).not.toContain(credentialId)
      } finally {
        await deactivateJwks(client, tenantId, headers, jwkKids)
        await cleanupS3Credentials(client, tenantId, headers, credentialIds, credentialDescription)
      }
    })

    it('covers tenant lifecycle, migration operations, health, metrics mutation, and queue admin contracts', async () => {
      const config = getAcceptanceConfig()
      const client = createAdminClient()
      const headers = {
        apikey: requireConfigValue(config.adminApiKey, 'ACCEPTANCE_ADMIN_API_KEY'),
      }
      const sourceTenantId = await resolveTenantId(client, headers)
      const sourceTenant = await client.request<TenantDetailResponse>(
        'GET',
        `/tenants/${sourceTenantId}`,
        {
          expectedStatus: 200,
          headers,
        }
      )

      const createdTenantId = uniqueTenantId()
      const upsertedTenantId = uniqueTenantId()
      const tenantIdsToCleanup = new Set<string>()

      try {
        const createTenantOverrides = config.adminReturnSensitiveData
          ? {
              fileSizeLimit: 1_048_576,
            }
          : {
              fileSizeLimit: 1_048_576,
              anonKey: 'abc',
              databaseUrl: config.adminDatabaseUrlOverride ?? 'def',
              jwtSecret: 'ghi',
              serviceKey: 'jkl',
            }
        await client.request('POST', `/tenants/${createdTenantId}`, {
          body: buildTenantProvisionBody(
            sourceTenant.json,
            createTenantOverrides,
            config.adminReturnSensitiveData
          ),
          expectedStatus: 201,
          headers,
        })
        tenantIdsToCleanup.add(createdTenantId)

        const tenants = await client.request<TenantSummary[]>('GET', '/tenants', {
          expectedStatus: 200,
          headers,
        })
        expect(tenants.json?.map((tenant) => tenant.id)).toContain(createdTenantId)

        await client.request('PATCH', `/tenants/${createdTenantId}`, {
          body: {
            fileSizeLimit: 2_097_152,
          },
          expectedStatus: 204,
          headers,
        })

        const patchedTenant = await client.request<TenantDetailResponse>(
          'GET',
          `/tenants/${createdTenantId}`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(patchedTenant.json?.fileSizeLimit).toBe(2_097_152)

        const health = await client.request<TenantHealthResponse>(
          'GET',
          `/tenants/${createdTenantId}/health`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(health.json?.healthy).toBe(true)

        const migrated = await client.request<TenantMigrationRunResponse>(
          'POST',
          `/tenants/${createdTenantId}/migrations`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(migrated.json?.migrated).toBe(true)

        const migrationState = await client.request<TenantMigrationResponse>(
          'GET',
          `/tenants/${createdTenantId}/migrations`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(migrationState.json?.isLatest).toBe(true)

        const resetTarget = migrationState.json?.migrationsVersion
        if (resetTarget) {
          const reset = await client.request<MessageResponse>(
            'POST',
            `/tenants/${createdTenantId}/migrations/reset`,
            {
              body: {
                untilMigration: resetTarget,
              },
              expectedStatus: 200,
              headers,
            }
          )
          expect(reset.json?.message).toBe('Migrations reset')
        }

        const putTenantOverrides = config.adminReturnSensitiveData
          ? {
              fileSizeLimit: 3_145_728,
            }
          : {
              fileSizeLimit: 3_145_728,
              anonKey: 'abc',
              databaseUrl: config.adminDatabaseUrlOverride ?? 'def',
              jwtSecret: 'ghi',
              serviceKey: 'jkl',
            }
        await client.request('PUT', `/tenants/${upsertedTenantId}`, {
          body: buildTenantProvisionBody(
            sourceTenant.json,
            putTenantOverrides,
            config.adminReturnSensitiveData
          ),
          expectedStatus: 204,
          headers,
        })
        tenantIdsToCleanup.add(upsertedTenantId)

        const putTenantOverride2 = config.adminReturnSensitiveData
          ? {
              fileSizeLimit: 4_194_304,
            }
          : {
              fileSizeLimit: 4_194_304,
              anonKey: 'abc',
              databaseUrl: config.adminDatabaseUrlOverride ?? 'def',
              jwtSecret: 'ghi',
              serviceKey: 'jkl',
            }
        await client.request('PUT', `/tenants/${upsertedTenantId}`, {
          body: buildTenantProvisionBody(
            sourceTenant.json,
            putTenantOverride2,
            config.adminReturnSensitiveData
          ),
          expectedStatus: 204,
          headers,
        })

        const upsertedTenant = await client.request<TenantDetailResponse>(
          'GET',
          `/tenants/${upsertedTenantId}`,
          {
            expectedStatus: 200,
            headers,
          }
        )
        expect(upsertedTenant.json?.fileSizeLimit).toBe(4_194_304)

        const migrationJobs = await client.request<unknown[] | MessageResponse>(
          'GET',
          `/tenants/${createdTenantId}/migrations/jobs`,
          {
            expectedStatus: [200, 400],
            headers,
          }
        )
        if (migrationJobs.status === 200) {
          expect(Array.isArray(migrationJobs.json)).toBe(true)
        } else {
          expect((migrationJobs.json as MessageResponse | undefined)?.message).toBe(
            'Queue is not enabled'
          )
        }

        const deletedMigrationJobs = await client.request<number | MessageResponse>(
          'DELETE',
          `/tenants/${createdTenantId}/migrations/jobs`,
          {
            expectedStatus: [200, 400],
            headers,
          }
        )
        if (deletedMigrationJobs.status === 200) {
          expect(typeof deletedMigrationJobs.json).toBe('number')
        } else {
          expect((deletedMigrationJobs.json as MessageResponse | undefined)?.message).toBe(
            'Queue is not enabled'
          )
        }

        await client.request('DELETE', `/tenants/${createdTenantId}`, {
          expectedStatus: 204,
          headers,
        })
        tenantIdsToCleanup.delete(createdTenantId)

        await client.request('GET', `/tenants/${createdTenantId}`, {
          expectedStatus: 404,
          headers,
        })
      } finally {
        for (const tenantId of tenantIdsToCleanup) {
          await client
            .request('DELETE', `/tenants/${tenantId}`, {
              expectedStatus: [204, 404],
              headers,
            })
            .catch(() => undefined)
        }
      }
    })

    it('rotates the url-signing key through a standby swap without breaking existing signed URLs, and publishes only the public key at well-known jwks', async () => {
      const config = getAcceptanceConfig()
      const client = createAdminClient()
      const headers = {
        apikey: requireConfigValue(config.adminApiKey, 'ACCEPTANCE_ADMIN_API_KEY'),
      }
      const tenantId = await resolveTenantId(client, headers)
      const restClient = createRestClient()
      const bucketName = uniqueBucketName('jwks-swap')
      const objectKey = uniqueObjectKey('jwks-swap')
      const encodedObjectKey = encodePathSegments(objectKey)
      const payload = `acceptance-jwks-swap-${config.runId}`
      const jwkKids = new Set<string>()

      const originalActiveKid = await findActiveUrlSigningKid(client, tenantId, headers)
      if (!originalActiveKid) {
        throw new Error(`Tenant ${tenantId} has no active url-signing key to rotate away from`)
      }

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, objectKey, payload)

        const signedBeforeSwap = await restClient.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodedObjectKey}`,
          {
            body: { expiresIn: 60 },
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )

        const standby = await client.request<JwksAddResponse>(
          'POST',
          `/tenants/${tenantId}/jwks/url-signing/standby`,
          {
            body: { type: 'ES256' },
            expectedStatus: 201,
            headers,
          }
        )
        const standbyKid = standby.json?.kid
        if (typeof standbyKid !== 'string' || standbyKid.length === 0) {
          throw new Error('Admin standby JWKS response did not include a non-empty kid')
        }
        jwkKids.add(standbyKid)

        // a kid is just the row's uuid, which a swap never changes - only its kind flips,
        // so the promoted key keeps the standby's kid
        const promotedKid = standbyKid

        await client.request(
          'POST',
          `/tenants/${tenantId}/jwks/url-signing/standby/${standbyKid}/swap`,
          {
            expectedStatus: 201,
            headers,
          }
        )

        const signedAfterSwap = await restClient.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodedObjectKey}`,
          {
            body: { expiresIn: 60 },
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )

        const beforeSwapResult = await restClient.request(
          'GET',
          signedBeforeSwap.json?.signedURL ?? '',
          { expectedStatus: 200 }
        )
        expect(beforeSwapResult.body).toBe(payload)

        const afterSwapResult = await restClient.request(
          'GET',
          signedAfterSwap.json?.signedURL ?? '',
          { expectedStatus: 200 }
        )
        expect(afterSwapResult.body).toBe(payload)

        const wellKnown = await restClient.request<WellKnownJwksResponse>(
          'GET',
          '/.well-known/jwks.json',
          {
            expectedStatus: 200,
            isExpectedResponse: (response) =>
              response.json?.keys.some((key) => key.kid === promotedKid) ?? false,
            retries: 10,
          }
        )
        const publicKey = wellKnown.json?.keys.find((key) => key.kid === promotedKid)
        expect(publicKey).toEqual({
          kty: 'EC',
          crv: 'P-256',
          x: expect.any(String),
          y: expect.any(String),
          kid: promotedKid,
          alg: 'ES256',
        })
      } finally {
        await client
          .request(
            'POST',
            `/tenants/${tenantId}/jwks/url-signing/standby/${originalActiveKid}/swap`,
            { expectedStatus: [201, 404], headers }
          )
          .catch(() => undefined)
        await cleanupRestResources(bucketName, [objectKey], restClient)
        await deactivateJwks(client, tenantId, headers, jwkKids)
      }
    })
  }
)

async function resolveTenantId(
  client: AcceptanceHttpClient,
  headers: Record<string, string>
): Promise<string> {
  const configuredTenantId = getAcceptanceConfig().tenantId
  if (configuredTenantId) {
    return configuredTenantId
  }

  const tenants = await client.request<TenantSummary[]>('GET', '/tenants', {
    expectedStatus: 200,
    headers,
  })
  const tenantId = tenants.json?.[0]?.id
  if (!tenantId) {
    throw new Error('Admin acceptance tests require ACCEPTANCE_TENANT_ID or at least one tenant')
  }

  return tenantId
}

async function findActiveUrlSigningKid(
  client: AcceptanceHttpClient,
  tenantId: string,
  headers: Record<string, string>
): Promise<string | undefined> {
  const jwks = await client.request<JwksListItem[]>('GET', `/tenants/${tenantId}/jwks`, {
    expectedStatus: 200,
    headers,
  })

  return jwks.json?.find((jwk) => jwk.active && jwk.kind === STORAGE_URL_SIGNING_KIND)?.kid
}

async function deactivateJwks(
  client: AcceptanceHttpClient,
  tenantId: string,
  headers: Record<string, string>,
  jwkKids: Set<string>
) {
  for (const kid of jwkKids) {
    await client
      .request('PUT', `/tenants/${tenantId}/jwks/${kid}`, {
        body: {
          active: false,
        },
        expectedStatus: [200, 400, 404],
        headers,
      })
      .catch(() => undefined)
  }
}

async function cleanupS3Credentials(
  client: AcceptanceHttpClient,
  tenantId: string,
  headers: Record<string, string>,
  credentialIds: Set<string>,
  credentialDescription: string
) {
  await client
    .request<S3CredentialListItem[]>('GET', `/s3/${tenantId}/credentials`, {
      expectedStatus: 200,
      headers,
    })
    .then((credentials) => {
      for (const credential of credentials.json ?? []) {
        if (credential.description === credentialDescription) {
          credentialIds.add(credential.id)
        }
      }
    })
    .catch(() => undefined)

  for (const credentialId of credentialIds) {
    await client
      .request('DELETE', `/s3/${tenantId}/credentials`, {
        body: {
          id: credentialId,
        },
        expectedStatus: [204, 400, 404],
        headers,
      })
      .catch(() => undefined)
  }
}

function uniqueTenantId(): string {
  const letters = randomUUID()
    .replace(/-/g, '')
    .split('')
    .map((char) => String.fromCharCode(97 + (Number.parseInt(char, 16) % 26)))
    .join('')

  return `acc${letters}`.slice(0, 20)
}

function buildTenantProvisionBody(
  sourceTenant: TenantDetailResponse | undefined,
  overrides: Partial<TenantDetailResponse>,
  returnSensitiveData: boolean
): Record<string, unknown> {
  const checkExpectedSensitiveData = returnSensitiveData ? requireString : requireUndefined
  const body: Record<string, unknown> = {
    anonKey: checkExpectedSensitiveData(sourceTenant?.anonKey, 'anonKey'),
    databaseUrl: checkExpectedSensitiveData(sourceTenant?.databaseUrl, 'databaseUrl'),
    features: normalizeTenantFeatures(sourceTenant?.features),
    jwtSecret: checkExpectedSensitiveData(sourceTenant?.jwtSecret, 'jwtSecret'),
    serviceKey: checkExpectedSensitiveData(sourceTenant?.serviceKey, 'serviceKey'),
    ...overrides,
  }

  if (typeof sourceTenant?.databasePoolUrl === 'string') {
    body.databasePoolUrl = sourceTenant.databasePoolUrl
  }

  if (typeof sourceTenant?.maxConnections === 'number') {
    body.maxConnections = sourceTenant.maxConnections
  }

  return body
}

function normalizeTenantFeatures(features: TenantFeatures | undefined): TenantFeatures {
  return {
    icebergCatalog: {
      enabled: Boolean(features?.icebergCatalog?.enabled),
      maxCatalogs: features?.icebergCatalog?.maxCatalogs,
      maxNamespaces: features?.icebergCatalog?.maxNamespaces,
      maxTables: features?.icebergCatalog?.maxTables,
    },
    imageTransformation: {
      enabled: Boolean(features?.imageTransformation?.enabled),
      maxResolution: features?.imageTransformation?.maxResolution ?? null,
    },
    purgeCache: {
      enabled: Boolean(features?.purgeCache?.enabled),
    },
    s3Protocol: {
      enabled: features?.s3Protocol?.enabled ?? true,
    },
    vectorBuckets: {
      enabled: Boolean(features?.vectorBuckets?.enabled),
      maxBuckets: features?.vectorBuckets?.maxBuckets,
      maxIndexes: features?.vectorBuckets?.maxIndexes,
    },
  }
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Admin tenant response did not include ${name}`)
  }

  return value
}

function requireUndefined(value: unknown, name: string): unknown {
  if (typeof value !== 'undefined') {
    throw new Error(`Admin tenant response unexpectedly included ${name}`)
  }
  return value
}
