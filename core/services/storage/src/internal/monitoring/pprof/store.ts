import { promisify } from 'node:util'
import { gzip as gzipCallback } from 'node:zlib'
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { getConfig } from '../../../config'
import type {
  ArchivedProfile,
  ProfileClass,
  ProfileIdentity,
  ProfileKind,
  ProfileRuntimeIdentity,
} from './store-key'
import {
  buildProfileKey,
  decodeProfileCursor,
  encodeProfileCursor,
  parseProfileKey,
  profileDateRange,
  reverseProfileTimestamp,
} from './store-key'

export type {
  ArchivedProfile,
  ProfileClass,
  ProfileIdentity,
  ProfileKind,
  ProfileRuntimeIdentity,
} from './store-key'
export { buildProfileKey, InvalidProfileDateError } from './store-key'

export class InvalidProfileCursorError extends Error {}
export class ProfileNotFoundError extends Error {}

const PROFILE_SCAN_PAGE_SIZE = 1000
const gzip = promisify(gzipCallback)
const { profilingS3Bucket, profilingS3Endpoint, profilingS3ForcePathStyle, profilingS3Region } =
  getConfig()

function resolveProfileKey(key: string) {
  const profile = parseProfileKey(key)
  if (!profile) throw new ProfileNotFoundError('Profile not found')
  return { key, profile }
}

function isS3ProfileNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const name = (error as { name?: unknown }).name
  return name === 'NoSuchKey' || name === 'NotFound'
}

export class ProfileStore {
  constructor(
    readonly client: S3Client,
    readonly bucket: string
  ) {}

  async archive(identity: ProfileIdentity, body: Buffer, runtimeIdentity: ProfileRuntimeIdentity) {
    const key = buildProfileKey(identity, runtimeIdentity)
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: await gzip(body),
        ContentType: 'application/gzip',
      })
    )
  }

  async list(options: {
    class: ProfileClass
    kind?: ProfileKind
    limit: number
    cursor?: string
    date?: string
  }) {
    const prefix = `v1/${options.class}/`
    const dateRange = options.date ? profileDateRange(options.date) : undefined
    let startAfter: string | undefined
    if (options.cursor) {
      try {
        startAfter = decodeProfileCursor(options.cursor)
      } catch {
        throw new InvalidProfileCursorError('Invalid profile cursor')
      }
      if (!startAfter.startsWith(prefix))
        throw new InvalidProfileCursorError('Invalid profile cursor')
    } else if (dateRange) {
      // Generated capture keys use '-' after the reverse timestamp. '/' sorts after
      // it, excluding captures at the next day's exact UTC boundary.
      startAfter = `${prefix}${reverseProfileTimestamp(dateRange.end)}/`
    }

    const profiles: ArchivedProfile[] = []
    const maxKeys = options.kind ? PROFILE_SCAN_PAGE_SIZE : options.limit
    while (profiles.length < options.limit) {
      const pageStartAfter = startAfter
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          StartAfter: startAfter,
          MaxKeys: maxKeys,
        })
      )
      const objects = response.Contents ?? []
      let reachedDateEnd = false

      for (let index = 0; index < objects.length; index++) {
        const object = objects[index]
        if (!object.Key) continue
        startAfter = object.Key
        const parsed = parseProfileKey(object.Key)
        if (!parsed) continue
        if (dateRange && parsed.startedAt.getTime() >= dateRange.end) continue
        if (dateRange && parsed.startedAt.getTime() < dateRange.start) {
          reachedDateEnd = true
          break
        }
        if (options.kind && parsed.kind !== options.kind) continue

        profiles.push({ ...parsed, size: object.Size, etag: object.ETag })
        if (profiles.length === options.limit) {
          const hasMore =
            index < objects.length - 1 ||
            response.IsTruncated === true ||
            response.NextContinuationToken !== undefined
          return { profiles, cursor: hasMore ? encodeProfileCursor(object.Key) : undefined }
        }
      }

      if (
        reachedDateEnd ||
        objects.length === 0 ||
        startAfter === pageStartAfter ||
        (response.IsTruncated !== true && response.NextContinuationToken === undefined)
      ) {
        break
      }
    }

    return { profiles, cursor: undefined }
  }

  async get(key: string) {
    const { profile } = resolveProfileKey(key)
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      return { object, profile }
    } catch (error) {
      if (isS3ProfileNotFoundError(error)) throw new ProfileNotFoundError('Profile not found')
      throw error
    }
  }

  destroy() {
    this.client.destroy()
  }
}

export function createProfileStore() {
  if (!profilingS3Bucket) throw new Error('PROFILING_S3_BUCKET is not configured')
  const client = new S3Client({
    region: profilingS3Region,
    endpoint: profilingS3Endpoint,
    forcePathStyle: profilingS3ForcePathStyle,
    maxAttempts: 2,
    requestHandler: new NodeHttpHandler({ connectionTimeout: 5_000, requestTimeout: 30_000 }),
  })
  return new ProfileStore(client, profilingS3Bucket)
}

let store: ProfileStore | undefined
export function getProfileStore() {
  if (!store) store = createProfileStore()
  return store
}
export function closeProfileStore() {
  store?.destroy()
  store = undefined
}
