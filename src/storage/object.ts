import { randomUUID } from 'node:crypto'
import {
  isDownloadScopedToken,
  isUploadScopedToken,
  SIGNED_URL_SCOPE_DOWNLOAD,
  SIGNED_URL_SCOPE_UPLOAD,
  SignedToken,
  SignedUploadToken,
  SignedUrlScope,
  signJWT,
  verifyJWT,
} from '@internal/auth'
import { getJwtSecret } from '@internal/database'
import { ERRORS } from '@internal/errors'
import { StorageObjectLocator } from '@storage/locator'
import { ObjectListEntry } from '@storage/schemas'
import { FastifyRequest } from 'fastify/types/request'
import { StorageBackendAdapter } from './backend'
import { Database, FindObjectFilters, SearchObjectOption } from './database'
import {
  ObjectAdminDelete,
  ObjectCreatedCopyEvent,
  ObjectCreatedMove,
  ObjectRemoved,
  ObjectRemovedMove,
} from './events'
import {
  MAX_OBJECTS_PER_DELETE_BATCH,
  MAX_OBJECTS_PER_LOOKUP_BATCH,
  mustBeValidKey,
} from './limits'
import { CanUploadMetadata, fileUploadFromRequest, Uploader, UploadRequest } from './uploader'

interface CopyObjectParams {
  sourceKey: string
  sourceVersionId?: string
  destinationBucket: string
  destinationKey: string
  owner?: string
  copyMetadata?: boolean
  preserveUnspecifiedFileMetadata?: boolean
  upsert?: boolean
  uploadType: 'standard' | 's3' | 'resumable'
  metadata?: {
    cacheControl?: string
    mimetype?: string
  }
  userMetadata?: Record<string, unknown>
  conditions?: {
    ifMatch?: string
    ifNoneMatch?: string
    ifModifiedSince?: Date
    ifUnmodifiedSince?: Date
  }
}
export type DeleteObjectEntry = string | { path: string; versionId: string }

export interface ListObjectsV2Result {
  folders: ObjectListEntry[]
  objects: ObjectListEntry[]
  hasNext: boolean
  nextCursor?: string
  nextCursorKey?: string
}

/**
 * ObjectStorage
 * interact with remote objects and database state
 */
export class ObjectStorage {
  protected readonly uploader: Uploader

  constructor(
    private readonly backend: StorageBackendAdapter,
    private readonly db: Database,
    private readonly location: StorageObjectLocator,
    private readonly bucketId: string
  ) {
    this.uploader = new Uploader(backend, db, location)
  }

  /**
   * Impersonate any subsequent chained operations
   * as superUser bypassing RLS rules
   */
  asSuperUser() {
    return new ObjectStorage(this.backend, this.db.asSuperUser(), this.location, this.bucketId)
  }

  async uploadFromRequest(
    request: FastifyRequest,
    file: {
      objectName: string
      owner?: string
      isUpsert: boolean
      signal?: AbortSignal
    }
  ) {
    const bucket = await this.db
      .asSuperUser()
      .findBucketById(this.bucketId, 'id, file_size_limit, allowed_mime_types')

    const uploadRequest = await fileUploadFromRequest(request, {
      objectName: file.objectName,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types || [],
    })

    return this.uploadNewObject({
      file: uploadRequest,
      objectName: file.objectName,
      owner: file.owner,
      isUpsert: Boolean(file.isUpsert),
      signal: file.signal,
      userMetadata: uploadRequest.userMetadata,
    })
  }

  /**
   * Upload a new object to a storage
   * @param request
   */
  async uploadNewObject(request: Omit<UploadRequest, 'bucketId' | 'uploadType'>) {
    mustBeValidKey(request.objectName)

    const path = `${this.bucketId}/${request.objectName}`

    const { metadata, obj } = await this.uploader.upload({
      ...request,
      bucketId: this.bucketId,
      uploadType: 'standard',
    })

    return { objectMetadata: metadata, path, id: obj.id }
  }

  /**
   * Deletes an object from the remote storage
   * and the database
   * @param objectName
   */
  async deleteObject(objectName: string, versionId?: string) {
    const obj = await this.db.withTransaction(async (db) => {
      const obj = await db.asSuperUser().findObject(
        this.bucketId,
        objectName,
        'id,version,metadata',
        {
          forUpdate: true,
        },
        versionId
      )

      const deleted = await db.deleteObject(this.bucketId, objectName, versionId)

      if (!deleted) {
        throw ERRORS.AccessDenied('Access denied')
      }

      await this.backend.deleteObject(
        this.location.getRootLocation(),
        this.location.getKeyLocation({
          tenantId: this.db.tenantId,
          bucketId: this.bucketId,
          objectName,
        }),
        obj.version
      )

      return obj
    })

    await ObjectRemoved.sendWebhook({
      tenant: this.db.tenant(),
      name: objectName,
      version: obj.version,
      bucketId: this.bucketId,
      reqId: this.db.reqId,
      sbReqId: this.db.sbReqId,
      metadata: obj.metadata,
    })
  }

  /**
   * Deletes multiple objects from the remote storage
   * and the database. Each entry is either a bare path (delete whichever
   * row is currently at that path) or a {path, versionId} pair (delete that
   * exact version only).
   * @param entries
   */
  async deleteObjects(entries: DeleteObjectEntry[]) {
    const results: { name: string }[] = []

    for (let i = 0; i < entries.length; i += MAX_OBJECTS_PER_DELETE_BATCH) {
      const entriesSubset = entries.slice(i, i + MAX_OBJECTS_PER_DELETE_BATCH)

      const plainNames: string[] = []
      const versionedEntries: { name: string; version: string }[] = []
      for (const entry of entriesSubset) {
        if (typeof entry === 'string') {
          plainNames.push(entry)
        } else {
          versionedEntries.push({ name: entry.path, version: entry.versionId })
        }
      }

      await this.db.withTransaction(async (db) => {
        const data = [
          ...(plainNames.length > 0
            ? await db.deleteObjects(this.bucketId, plainNames, 'name')
            : []),
          ...(versionedEntries.length > 0
            ? await db.deleteObjectVersions(this.bucketId, versionedEntries)
            : []),
        ]

        if (data.length > 0) {
          results.push(...data)

          // if successfully deleted, delete from s3 too
          // todo: consider moving this to a queue
          const prefixesToDelete = data.reduce((all, { name, version }) => {
            const location = this.location.getKeyLocation({
              tenantId: db.tenantId,
              bucketId: this.bucketId,
              objectName: name,
              version,
            })

            all.push(location)

            if (version) {
              all.push(`${location}.info`)
            }
            return all
          }, [] as string[])

          await this.backend.deleteObjects(this.location.getRootLocation(), prefixesToDelete)

          await Promise.allSettled(
            data.map((object) =>
              ObjectRemoved.sendWebhook({
                tenant: db.tenant(),
                name: object.name,
                bucketId: this.bucketId,
                reqId: this.db.reqId,
                sbReqId: this.db.sbReqId,
                version: object.version,
                metadata: object.metadata,
              })
            )
          )
        }
      })
    }

    return results
  }

  /**
   * Updates the owner of an object in the database
   * @param objectName
   * @param owner
   */
  updateObjectOwner(objectName: string, owner?: string) {
    return this.db.updateObjectOwner(this.bucketId, objectName, owner)
  }

  /**
   * Finds an object by name, optionally pinned to a specific version id
   * @param objectName
   * @param columns
   * @param filters
   * @param version
   */
  async findObject(
    objectName: string,
    columns = 'id',
    filters?: FindObjectFilters,
    version?: string
  ) {
    mustBeValidKey(objectName)

    return this.db.findObject(this.bucketId, objectName, columns, filters, version)
  }

  /**
   * Find multiple objects by name
   * @param objectNames
   * @param columns
   */
  async findObjects(objectNames: string[], columns = 'id') {
    return this.db.findObjects(this.bucketId, objectNames, columns)
  }

  /**
   * Copies an existing remote object to a given location
   * @param sourceKey
   * @param destinationBucket
   * @param destinationKey
   * @param owner
   * @param conditions
   * @param copyMetadata
   * @param preserveUnspecifiedFileMetadata
   * @param upsert
   * @param fileMetadata
   * @param userMetadata
   */
  async copyObject({
    sourceKey,
    sourceVersionId,
    destinationBucket,
    destinationKey,
    owner,
    conditions,
    copyMetadata = true,
    preserveUnspecifiedFileMetadata,
    upsert,
    uploadType,
    metadata: fileMetadata,
    userMetadata,
  }: CopyObjectParams) {
    mustBeValidKey(destinationKey)

    const newVersion = randomUUID()
    const s3SourceKey = this.location.getKeyLocation({
      tenantId: this.db.tenantId,
      bucketId: this.bucketId,
      objectName: sourceKey,
    })
    const s3DestinationKey = this.location.getKeyLocation({
      tenantId: this.db.tenantId,
      bucketId: destinationBucket,
      objectName: destinationKey,
    })

    // We check if the user has permission to copy the object to the destination key
    const originObject = await this.db.findObject(
      this.bucketId,
      sourceKey,
      'bucket_id,metadata,user_metadata,version',
      undefined,
      sourceVersionId
    )

    const baseMetadata = originObject.metadata || {}
    const destinationMetadata = { ...baseMetadata }

    if (!copyMetadata) {
      if (!preserveUnspecifiedFileMetadata) {
        delete destinationMetadata.cacheControl
        delete destinationMetadata.mimetype
      }

      if (fileMetadata?.cacheControl !== undefined) {
        destinationMetadata.cacheControl = fileMetadata.cacheControl
      }
      if (fileMetadata?.mimetype !== undefined) {
        destinationMetadata.mimetype = fileMetadata.mimetype
      }
    }

    const destinationUserMetadata = copyMetadata ? originObject.user_metadata : userMetadata

    await this.uploader.canUpload({
      bucketId: destinationBucket,
      objectName: destinationKey,
      owner,
      isUpsert: upsert,
      userMetadata: destinationUserMetadata || undefined,
      metadata: destinationMetadata,
    })

    try {
      const copyResult = await this.backend.copyObject(
        this.location.getRootLocation(),
        s3SourceKey,
        originObject.version,
        s3DestinationKey,
        newVersion,
        destinationMetadata,
        conditions,
        { copyMetadata }
      )

      const metadata = await this.backend.headObject(
        this.location.getRootLocation(),
        s3DestinationKey,
        newVersion
      )

      const destinationObject = await this.db.asSuperUser().withTransaction(async (db) => {
        await db.waitObjectLock(destinationBucket, destinationKey, undefined, {
          timeout: 3000,
        })

        const existingDestObject = await db.findObject(
          destinationBucket,
          destinationKey,
          'id,name,metadata,version,bucket_id',
          {
            dontErrorOnEmpty: true,
            forUpdate: true,
          }
        )

        const destinationObject = await db.upsertObject({
          ...originObject,
          bucket_id: destinationBucket,
          name: destinationKey,
          owner,
          metadata: {
            ...destinationMetadata,
            lastModified: copyResult.lastModified,
            eTag: copyResult.eTag,
          },
          user_metadata: destinationUserMetadata,
          version: newVersion,
        })

        if (existingDestObject) {
          await ObjectAdminDelete.send({
            name: existingDestObject.name,
            bucketId: existingDestObject.bucket_id ?? destinationBucket,
            tenant: this.db.tenant(),
            version: existingDestObject.version,
            reqId: this.db.reqId,
            sbReqId: this.db.sbReqId,
          })
        }

        return destinationObject
      })

      await ObjectCreatedCopyEvent.sendWebhook({
        tenant: this.db.tenant(),
        name: destinationKey,
        version: newVersion,
        bucketId: destinationBucket,
        metadata,
        uploadType,
        reqId: this.db.reqId,
        sbReqId: this.db.sbReqId,
      })

      return {
        destObject: destinationObject,
        httpStatusCode: copyResult.httpStatusCode,
        eTag: copyResult.eTag,
        lastModified: copyResult.lastModified,
      }
    } catch (e) {
      await ObjectAdminDelete.send({
        name: destinationKey,
        bucketId: destinationBucket,
        tenant: this.db.tenant(),
        version: newVersion,
        reqId: this.db.reqId,
        sbReqId: this.db.sbReqId,
      })
      throw e
    }
  }

  /**
   * Moves an existing remote object to a given location
   * @param sourceObjectName
   * @param destinationBucket
   * @param destinationObjectName
   * @param owner
   */
  async moveObject(
    sourceObjectName: string,
    destinationBucket: string,
    destinationObjectName: string,
    uploadType: 'standard' | 's3' | 'resumable',
    owner?: string,
    sourceVersionId?: string
  ) {
    mustBeValidKey(destinationObjectName)

    const newVersion = randomUUID()
    const s3SourceKey = this.location.getKeyLocation({
      tenantId: this.db.tenantId,
      bucketId: this.bucketId,
      objectName: sourceObjectName,
    })

    const s3DestinationKey = this.location.getKeyLocation({
      tenantId: this.db.tenantId,
      bucketId: destinationBucket,
      objectName: destinationObjectName,
    })

    await this.db.testPermission(async (db) => {
      await db.findObject(this.bucketId, sourceObjectName, 'id', undefined, sourceVersionId)
      return db.updateObject(
        this.bucketId,
        sourceObjectName,
        {
          name: destinationObjectName,
          version: newVersion,
          bucket_id: destinationBucket,
          owner,
        },
        sourceVersionId
      )
    })

    const sourceObj = await this.db
      .asSuperUser()
      .findObject(
        this.bucketId,
        sourceObjectName,
        'id, version,user_metadata',
        undefined,
        sourceVersionId
      )

    if (s3SourceKey === s3DestinationKey) {
      return {
        destObject: sourceObj,
      }
    }

    try {
      await this.backend.copyObject(
        this.location.getRootLocation(),
        s3SourceKey,
        sourceObj.version,
        s3DestinationKey,
        newVersion
      )

      const metadata = await this.backend.headObject(
        this.location.getRootLocation(),
        s3DestinationKey,
        newVersion
      )

      return this.db.asSuperUser().withTransaction(async (db) => {
        await db.waitObjectLock(this.bucketId, destinationObjectName, undefined, {
          timeout: 5000,
        })

        const sourceObject = await db.findObject(
          this.bucketId,
          sourceObjectName,
          'id,version,metadata,user_metadata',
          {
            forUpdate: true,
            dontErrorOnEmpty: false,
          },
          sourceVersionId
        )

        await db.updateObject(
          this.bucketId,
          sourceObjectName,
          {
            name: destinationObjectName,
            bucket_id: destinationBucket,
            version: newVersion,
            owner,
            metadata,
            user_metadata: sourceObj.user_metadata,
          },
          sourceVersionId
        )

        await ObjectAdminDelete.send({
          name: sourceObjectName,
          bucketId: this.bucketId,
          tenant: this.db.tenant(),
          version: sourceObj.version,
          reqId: this.db.reqId,
          sbReqId: this.db.sbReqId,
        })

        await Promise.allSettled([
          ObjectRemovedMove.sendWebhook({
            tenant: this.db.tenant(),
            name: sourceObjectName,
            bucketId: this.bucketId,
            reqId: this.db.reqId,
            sbReqId: this.db.sbReqId,
            version: sourceObject.version,
            metadata: sourceObject.metadata,
          }),
          ObjectCreatedMove.sendWebhook({
            tenant: this.db.tenant(),
            name: destinationObjectName,
            version: newVersion,
            bucketId: destinationBucket,
            metadata,
            uploadType,
            oldObject: {
              name: sourceObjectName,
              bucketId: this.bucketId,
              reqId: this.db.reqId,
              version: sourceObject.version,
            },
            reqId: this.db.reqId,
            sbReqId: this.db.sbReqId,
          }),
        ])

        return {
          destObject: {
            id: sourceObject.id,
            name: destinationObjectName,
            bucket_id: destinationBucket,
            version: newVersion,
            owner,
            metadata,
          },
        }
      })
    } catch (e) {
      await ObjectAdminDelete.send({
        name: destinationObjectName,
        bucketId: destinationBucket,
        tenant: this.db.tenant(),
        version: newVersion,
        reqId: this.db.reqId,
        sbReqId: this.db.sbReqId,
      })
      throw e
    }
  }

  /**
   * Search objects by prefix
   * @param prefix
   * @param options
   */
  async searchObjects(prefix: string, options: SearchObjectOption) {
    if (!options.exactMatch && prefix.length > 0 && !prefix.endsWith('/')) {
      // assuming prefix is always a folder - exactMatch means the caller
      // wants this literal key, not a folder, so skip the normalization.
      prefix = `${prefix}/`
    }

    return this.db.searchObjects(this.bucketId, prefix, options)
  }

  async listObjectsV2(options?: {
    prefix?: string
    delimiter?: string
    cursor?: string
    startAfter?: string
    maxKeys?: number
    sortBy?: {
      column: 'name' | 'created_at' | 'updated_at'
      order?: string
    }
    noncurrentVersions?: 'exclude' | 'include' | 'only'
    deleteMarkers?: 'exclude' | 'include' | 'only'
    exactMatch?: boolean
    // Set by the S3-compatible route, which has no request field for
    // noncurrentVersions/deleteMarkers, this way we can reject a cursor that tries
    // to adds them in instead of silently trusting it.
    s3Compatible?: boolean
  }): Promise<ListObjectsV2Result> {
    const limit = Math.min(options?.maxKeys || 1000, 1000)
    const prefix = options?.prefix || ''
    const delimiter = options?.delimiter

    const cursor = options?.cursor
      ? decodeContinuationToken(
          options.cursor,
          options.s3Compatible ? S3_ALLOWED_CONTINUATION_TOKEN_KEYS : undefined,
          options.s3Compatible ? S3_ALLOWED_CONTINUATION_TOKEN_VALUES : undefined
        )
      : undefined

    const noncurrentVersions = resolveLockedListParam(
      'noncurrentVersions',
      cursor,
      options?.noncurrentVersions
    )
    const deleteMarkers = resolveLockedListParam('deleteMarkers', cursor, options?.deleteMarkers)
    const exactMatch =
      resolveLockedListParam('exactMatch', cursor, options?.exactMatch?.toString()) === 'true'
    if (
      exactMatch &&
      cursor &&
      options?.prefix !== undefined &&
      options.prefix !== cursor.startAfter
    ) {
      throw ERRORS.InvalidParameter('prefix', {
        message: `prefix must match the value used to obtain this continuation token (expected "${cursor.startAfter}")`,
      })
    }
    const multiRow = noncurrentVersions === 'only' || noncurrentVersions === 'include'
    let searchResult = await this.db.listObjectsV2(this.bucketId, {
      prefix: options?.prefix,
      delimiter: options?.delimiter,
      maxKeys: limit + 1,
      nextToken: cursor?.startAfter,
      startAfter: cursor?.startAfter || options?.startAfter,
      sortBy: {
        // Sort order keeps its existing behavior of silently preferring the cursor value.
        order: cursor?.sortOrder || options?.sortBy?.order,
        column: cursor?.sortColumn || options?.sortBy?.column,
        after: cursor?.sortColumnAfter,
        afterVersion: cursor?.afterVersion,
        afterArchivedAt: cursor?.afterArchivedAt,
      },
      noncurrentVersions,
      deleteMarkers,
      exactMatch,
    })

    let prevPrefix = ''

    // exactMatch has no folders to collapse into - a single key can't be
    // split by the delimiter into a folder entry, it's returned as-is.
    if (delimiter && !exactMatch) {
      const delimitedResults: ObjectListEntry[] = []
      for (const object of searchResult) {
        let idx = object.name.slice(prefix.length).indexOf(delimiter)

        if (idx >= 0) {
          idx = prefix.length + idx + delimiter.length
          const currPrefix = object.name.substring(0, idx)
          if (currPrefix === prevPrefix) {
            continue
          }
          prevPrefix = currPrefix
          delimitedResults.push({
            id: null,
            name: currPrefix,
            bucket_id: this.bucketId,
            updated_at: object.updated_at,
            created_at: object.created_at,
            last_accessed_at: object.last_accessed_at,
          })
          continue
        }

        delimitedResults.push(object)
      }
      searchResult = delimitedResults
    }

    const isTruncated = searchResult.length > limit
    const resultCount = isTruncated ? limit : searchResult.length

    const folders: ObjectListEntry[] = []
    const objects: ObjectListEntry[] = []
    for (let index = 0; index < resultCount; index++) {
      const obj = searchResult[index]
      const target = obj.id === null ? folders : objects
      const name =
        obj.id === null && delimiter && !obj.name.endsWith(delimiter)
          ? obj.name + delimiter
          : obj.name
      target.push({
        ...obj,
        name,
      })
    }

    let nextContinuationToken: string | undefined
    let nextCursorKey: string | undefined

    if (isTruncated) {
      const lastObject = searchResult[resultCount - 1]
      const sortColumn = (cursor?.sortColumn || options?.sortBy?.column) as
        | 'name'
        | 'created_at'
        | 'updated_at'
        | undefined

      // Only an explicit non-name sortColumn needs a sortColumnAfter cursor -
      // the name-sort-with-multiRow case resumes via afterArchivedAt/afterVersion
      // below instead, since archived_at (not created_at) is the tiebreak
      // that actually governs version order for that case.
      const needsTiebreak = sortColumn && sortColumn !== 'name'

      nextContinuationToken = encodeContinuationToken({
        startAfter: lastObject.name,
        sortOrder: cursor?.sortOrder || options?.sortBy?.order,
        sortColumn,
        sortColumnAfter:
          needsTiebreak && lastObject[sortColumn]
            ? new Date(lastObject[sortColumn]).toISOString()
            : undefined,
        afterVersion: multiRow ? (lastObject.version ?? undefined) : undefined,
        afterArchivedAt: multiRow
          ? lastObject.archived_at
            ? new Date(lastObject.archived_at).toISOString()
            : 'infinity'
          : undefined,
        noncurrentVersions,
        deleteMarkers,
        exactMatch: exactMatch ? 'true' : undefined,
      })
      nextCursorKey = lastObject.name
    }

    return {
      hasNext: isTruncated,
      nextCursor: nextContinuationToken,
      nextCursorKey,
      folders,
      objects,
    }
  }

  /**
   * Generates a signed url for accessing an object securely
   * @param objectName
   * @param url
   * @param expiresIn seconds
   * @param metadata
   */
  async signObjectUrl(
    objectName: string,
    url: string,
    expiresIn: number,
    metadata?: Record<string, string | object | undefined>,
    versionId?: string
  ) {
    await this.findObject(objectName, 'id', undefined, versionId)

    metadata = metadata || {}
    for (const key in metadata) {
      if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
        continue
      }

      if (!metadata[key]) {
        delete metadata[key]
      }
    }

    // security-in-depth: as signObjectUrl could be used as a signing oracle,
    // make sure it's never able to specify a role JWT claim, nor the claims that
    // identify an upload token (upsert/owner) — otherwise a download token could
    // be crafted to satisfy the upload-endpoint's legacy compatibility check.
    delete metadata['role']
    delete metadata['upsert']
    delete metadata['owner']

    const urlParts = url.split('/')
    const urlToSign = decodeURI(urlParts.splice(3).join('/'))
    const { urlSigningKey } = await getJwtSecret(this.db.tenantId)
    // `url`, `scope`, and `versionId` are spread last so attacker-controlled
    // metadata can never override the intended object path, token scope, or
    // pinned version (token-forgery defense)
    const token = await signJWT(
      {
        ...metadata,
        url: urlToSign,
        scope: SIGNED_URL_SCOPE_DOWNLOAD,
        ...(versionId ? { versionId } : {}),
      },
      urlSigningKey,
      expiresIn
    )

    let urlPath = 'object'

    if (metadata?.transformations) {
      urlPath = 'render/image'
    }

    // @todo parse the url properly
    return `/${urlPath}/sign/${urlToSign}?token=${token}`
  }

  /**
   * Generates multiple signed urls
   * @param paths
   * @param expiresIn
   */
  async signObjectUrls(paths: string[], expiresIn: number) {
    let results: { name: string }[]

    if (paths.length <= MAX_OBJECTS_PER_LOOKUP_BATCH) {
      results = await this.findObjects(paths, 'name')
    } else {
      results = []

      for (let i = 0; i < paths.length; i += MAX_OBJECTS_PER_LOOKUP_BATCH) {
        const pathsSubset = paths.slice(i, i + MAX_OBJECTS_PER_LOOKUP_BATCH)

        const objects = await this.findObjects(pathsSubset, 'name')
        results.push(...objects)
      }
    }

    const nameSet = new Set<string>()
    for (const { name } of results) {
      nameSet.add(name)
    }

    const { urlSigningKey } = await getJwtSecret(this.db.tenantId)

    return Promise.all(
      paths.map(async (path) => {
        let error = null
        let signedURL = null
        if (nameSet.has(path)) {
          const urlToSign = `${this.bucketId}/${path}`
          const token = await signJWT(
            { url: urlToSign, scope: SIGNED_URL_SCOPE_DOWNLOAD },
            urlSigningKey,
            expiresIn
          )
          signedURL = `/object/sign/${urlToSign}?token=${token}`
        } else {
          error = 'Either the object does not exist or you do not have access to it'
        }
        return {
          error,
          path,
          signedURL,
        }
      })
    )
  }

  /**
   * Generates a signed url for uploading an object
   * @param objectName
   * @param url
   * @param expiresIn seconds
   * @param owner
   * @param options
   */
  async signUploadObjectUrl(
    objectName: string,
    url: string,
    expiresIn: number,
    owner?: string,
    options?: {
      upsert?: boolean
      userMetadata?: Record<string, unknown>
      metadata?: CanUploadMetadata
    }
  ) {
    // check if user has INSERT permissions
    await this.uploader.canUpload({
      bucketId: this.bucketId,
      objectName,
      owner,
      isUpsert: options?.upsert ?? false,
      userMetadata: options?.userMetadata,
      metadata: options?.metadata,
    })

    const { urlSigningKey } = await getJwtSecret(this.db.tenantId)
    const token = await signJWT(
      { owner, url, upsert: Boolean(options?.upsert), scope: SIGNED_URL_SCOPE_UPLOAD },
      urlSigningKey,
      expiresIn
    )

    return { url: `/object/upload/sign/${url}?token=${token}`, token }
  }

  /**
   * Verify a signed-URL token for a specific object, enforcing that it was issued
   * for the requested action. This is the single place that validates a signed
   * token: signature, scope, object-path binding, and expiry.
   * @param token
   * @param objectName
   * @param scope the action the token must be authorized for (download or upload)
   */
  async verifyObjectSignature<Scope extends SignedUrlScope>(
    token: string,
    objectName: string,
    scope: Scope
  ): Promise<Scope extends typeof SIGNED_URL_SCOPE_UPLOAD ? SignedUploadToken : SignedToken> {
    const { secret: jwtSecret, jwks } = await getJwtSecret(this.db.tenantId)

    let payload: SignedToken | SignedUploadToken
    try {
      payload = await verifyJWT<SignedToken | SignedUploadToken>(token, jwtSecret, jwks)
    } catch (e) {
      const err = e as Error
      throw ERRORS.InvalidJWT(err)
    }

    const hasValidScope =
      scope === SIGNED_URL_SCOPE_UPLOAD
        ? isUploadScopedToken(payload)
        : isDownloadScopedToken(payload)
    if (!hasValidScope) {
      throw ERRORS.InvalidSignature(`Token is not scoped for ${scope}`)
    }

    if (payload.url !== `${this.bucketId}/${objectName}`) {
      throw ERRORS.InvalidSignature()
    }

    if (payload.exp * 1000 < Date.now()) {
      throw ERRORS.ExpiredSignature()
    }

    // the scope check above guarantees the payload matches the requested scope;
    // TS can't correlate the runtime value with the conditional return type.
    return payload as Scope extends typeof SIGNED_URL_SCOPE_UPLOAD ? SignedUploadToken : SignedToken
  }
}

interface ContinuationToken {
  startAfter: string
  sortOrder?: string // 'asc' | 'desc'
  sortColumn?: string
  sortColumnAfter?: string
  afterVersion?: string
  afterArchivedAt?: string
  noncurrentVersions?: string
  deleteMarkers?: string
  exactMatch?: string // 'true' | 'false'
}

const S3_CONTINUATION_TOKEN_PART_MAP = {
  l: 'startAfter',
  // Accept legacy o:asc tokens. TODO: remove after old tokens expire.
  o: 'sortOrder',
} satisfies Record<string, keyof ContinuationToken>

const CONTINUATION_TOKEN_PART_MAP: Record<string, keyof ContinuationToken> = {
  ...S3_CONTINUATION_TOKEN_PART_MAP,
  c: 'sortColumn',
  a: 'sortColumnAfter',
  v: 'afterVersion',
  r: 'afterArchivedAt',
  n: 'noncurrentVersions',
  d: 'deleteMarkers',
  e: 'exactMatch',
}

const CONTINUATION_TOKEN_DEFAULTS = {
  // Keep default-valued fields out of newly issued tokens so an older pod can
  // decode tokens produced during a rolling deployment.
  sortOrder: 'asc',
  sortColumn: 'name',
  noncurrentVersions: 'exclude',
  deleteMarkers: 'exclude',
  exactMatch: 'false',
} satisfies Partial<Record<keyof ContinuationToken, string>>

// Sort options silently prefer cursor values instead of rejecting changed request values.
type StrictListParam = Exclude<keyof typeof CONTINUATION_TOKEN_DEFAULTS, 'sortOrder' | 'sortColumn'>

const isDefaultTokenParam = (
  key: keyof ContinuationToken
): key is keyof typeof CONTINUATION_TOKEN_DEFAULTS => key in CONTINUATION_TOKEN_DEFAULTS

/**
 * Locks noncurrentVersions/deleteMarkers/exactMatch to whatever a continuation
 * token already carries, since afterVersion/afterArchivedAt only mean "resume
 * mid-key" under the mode that produced them, and an exact-match listing must
 * not widen into a prefix scan once the key's versions are exhausted. The
 * cursor is undefined on the first page because no token exists yet; decoded
 * cursors restore omitted defaults before reaching this helper. `requested`
 * must be read before any default is applied, or an omitted filter becomes
 * indistinguishable from an explicitly resent default.
 *
 * @param name the locked option, also used in the thrown error's message
 * @param cursor the decoded continuation token, if any
 * @param requested the raw value from the caller's request, read before any default is applied
 */
function resolveLockedListParam<T extends string>(
  name: StrictListParam,
  cursor: ContinuationToken | undefined,
  requested: T | undefined
): T {
  const stored = cursor?.[name]
  if (stored === undefined) {
    return (requested ?? CONTINUATION_TOKEN_DEFAULTS[name]) as T
  }

  if (requested !== undefined && requested !== stored) {
    throw ERRORS.InvalidParameter(name, {
      message: `${name} must match the value used to obtain this continuation token (expected "${stored}")`,
    })
  }

  return stored as T
}

function encodeContinuationToken(tokenInfo: ContinuationToken) {
  let result = ''
  for (const [k, v] of Object.entries(CONTINUATION_TOKEN_PART_MAP)) {
    const value = tokenInfo[v]
    if (value && !(isDefaultTokenParam(v) && value === CONTINUATION_TOKEN_DEFAULTS[v])) {
      result += `${k}:${value}\n`
    }
  }
  return Buffer.from(result.slice(0, -1)).toString('base64')
}

const CONTINUATION_TOKEN_TRI_STATE_VALUES: ReadonlySet<string> = new Set([
  'exclude',
  'include',
  'only',
])
const CONTINUATION_TOKEN_BOOLEAN_VALUES: ReadonlySet<string> = new Set(['true', 'false'])
const CONTINUATION_TOKEN_SORT_ORDER_VALUES: ReadonlySet<string> = new Set(['asc', 'desc'])
const CONTINUATION_TOKEN_SORT_COLUMN_VALUES: ReadonlySet<string> = new Set([
  'name',
  'created_at',
  'updated_at',
])
const CONTINUATION_TOKEN_ALLOWED_VALUES: Partial<Record<string, ReadonlySet<string>>> = {
  o: CONTINUATION_TOKEN_SORT_ORDER_VALUES,
  c: CONTINUATION_TOKEN_SORT_COLUMN_VALUES,
  n: CONTINUATION_TOKEN_TRI_STATE_VALUES,
  d: CONTINUATION_TOKEN_TRI_STATE_VALUES,
  e: CONTINUATION_TOKEN_BOOLEAN_VALUES,
}

const S3_ALLOWED_CONTINUATION_TOKEN_KEYS = new Set(Object.keys(S3_CONTINUATION_TOKEN_PART_MAP))
const S3_ALLOWED_CONTINUATION_TOKEN_VALUES: Partial<Record<string, ReadonlySet<string>>> = {
  o: new Set(['asc']),
}

function decodeContinuationToken(
  token: string,
  allowedKeys?: ReadonlySet<string>,
  routeAllowedValues?: Partial<Record<string, ReadonlySet<string>>>
): ContinuationToken {
  const decodedParts = Buffer.from(token, 'base64').toString().split('\n')
  const result: ContinuationToken = {
    ...CONTINUATION_TOKEN_DEFAULTS,
    startAfter: '',
  }
  for (const part of decodedParts) {
    const partMatch = part.match(/^(\S):(.*)/)
    if (!partMatch || partMatch.length !== 3 || !(partMatch[1] in CONTINUATION_TOKEN_PART_MAP)) {
      throw ERRORS.InvalidParameter('continuation token')
    }
    if (allowedKeys && !allowedKeys.has(partMatch[1])) {
      throw ERRORS.InvalidParameter('continuation token')
    }
    const routeValues = routeAllowedValues?.[partMatch[1]]
    if (routeValues && !routeValues.has(partMatch[2])) {
      throw ERRORS.InvalidParameter('continuation token')
    }
    const allowedValues = CONTINUATION_TOKEN_ALLOWED_VALUES[partMatch[1]]
    if (allowedValues && !allowedValues.has(partMatch[2])) {
      throw ERRORS.InvalidParameter('continuation token')
    }
    result[CONTINUATION_TOKEN_PART_MAP[partMatch[1]]] = partMatch[2]
  }
  return result
}
