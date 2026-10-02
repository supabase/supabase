import { mergeAsyncGenerators } from '@internal/concurrency'
import { ERRORS } from '@internal/errors'
import { withOptionalVersion } from '@storage/backend'
import { BackupObjectEvent } from '@storage/events/objects/backup-object'
import { Storage } from '@storage/storage'
import { getConfig } from '../../config'

const { storageS3Bucket } = getConfig()

const S3_KEYS_TMP_TABLE_NAME = 'storage._s3_remote_keys'

interface OrphanObject {
  name: string
  size: number
  version?: string
}

/**
 * ObjectScanner is a utility class to scan and compare objects in the database and S3
 * it traverses all objects in the database and S3 and yields orphaned keys
 */
export class ObjectScanner {
  constructor(private readonly storage: Storage) {}

  /**
   * List all orphaned objects in the database and S3
   * @param bucket
   * @param options
   */
  async *listOrphaned(
    bucket: string,
    options: { before?: Date; keepTmpTable?: boolean; signal: AbortSignal }
  ) {
    const tmpTable = `${S3_KEYS_TMP_TABLE_NAME}_${Date.now()}`
    const prefix = `${this.storage.db.tenantId}/${bucket}`

    const localDBKeys = this.syncS3KeysToDB(tmpTable, prefix, options)

    try {
      for await (const _ of localDBKeys) {
        // await all of the operation finished
        if (options.signal.aborted) {
          throw ERRORS.Aborted('Operation was aborted')
        }
      }

      const s3Keys = this.listS3Orphans(tmpTable, {
        bucket,
        prefix,
        signal: options.signal,
      })

      const dbKeys = this.listDBOrphans(tmpTable, {
        bucket,
        before: options.before,
        signal: options.signal,
      })

      for await (const orphan of mergeAsyncGenerators({
        s3Orphans: s3Keys,
        dbOrphans: dbKeys,
      })) {
        if (options.signal.aborted) {
          throw ERRORS.Aborted('Operation was aborted')
        }
        yield orphan
      }
    } finally {
      if (!options.keepTmpTable) {
        await this.storage.db.dropS3KeysTempTable(tmpTable)
      }
    }
  }

  /**
   * Delete orphaned objects in the database and S3
   *
   * @param bucket
   * @param options
   */
  async *deleteOrphans(
    bucket: string,
    options: {
      before?: Date
      deleteDbKeys?: boolean
      deleteS3Keys?: boolean
      tmpTable?: string
      signal: AbortSignal
    }
  ) {
    const prefix = `${this.storage.db.tenantId}/${bucket}`
    const tmpTable = options.tmpTable || `${S3_KEYS_TMP_TABLE_NAME}_${Date.now()}`

    try {
      const iterators = {} as {
        dbOrphans: AsyncGenerator<OrphanObject[]> | undefined
        s3Orphans: AsyncGenerator<OrphanObject[]> | undefined
      }

      if (!options.tmpTable) {
        const s3LocalCache = this.syncS3KeysToDB(tmpTable, prefix, options)

        for await (const _ of s3LocalCache) {
          // await all of the operation finished
          if (options.signal.aborted) {
            throw ERRORS.Aborted('Operation was aborted')
          }
        }
      }

      if (options.deleteDbKeys) {
        iterators['dbOrphans'] = this.deleteDBOrphans(tmpTable, {
          ...options,
          bucket,
          prefix,
        })
      }

      if (options.deleteS3Keys) {
        iterators['s3Orphans'] = this.deleteS3Orphans(tmpTable, {
          ...options,
          bucket,
          prefix,
        })
      }

      const iterator = mergeAsyncGenerators({
        dbOrphans: iterators.dbOrphans || (async function* () {})(),
        s3Orphans: iterators.s3Orphans || (async function* () {})(),
      })

      for await (const result of iterator) {
        yield result
      }
    } finally {
      await this.storage.db.dropS3KeysTempTable(tmpTable)
    }
  }

  /**
   * List all objects in the database for a given bucket
   * yields max 1000 keys at a time
   *
   * @param bucket
   * @param options
   */
  protected async *listAllDbObjects(
    bucket: string,
    options: { before?: Date; signal: AbortSignal }
  ) {
    let nextToken: string | undefined = undefined

    for (; !options.signal.aborted; ) {
      const storageObjects = await this.storage.db.listObjects(
        bucket,
        'id,name,version,metadata',
        1000,
        options.before,
        nextToken
      )

      const dbKeys = storageObjects.map(({ name, version, metadata }) => {
        if (version) {
          return { name: `${name}`, version, size: (metadata?.size as number) || 0 }
        }
        return { name, size: (metadata?.size as number) || 0 }
      })

      if (storageObjects.length === 0) {
        break
      }

      yield dbKeys

      if (storageObjects.length < 1000) {
        break
      }

      const lastObj = storageObjects[storageObjects.length - 1]

      if (lastObj.version) {
        nextToken = `${lastObj.name}/${lastObj.version}`
      } else {
        nextToken = lastObj.name
      }
    }
  }

  protected async *listAllCacheS3Keys(tableName: string, nextItem: string, signal: AbortSignal) {
    for (; !signal.aborted; ) {
      const result = await this.storage.db.listS3KeysFromTempTable(tableName, nextItem, 1000)

      if (result.length === 1000) {
        nextItem = result[result.length - 1].key
      }

      if (result.length === 0) {
        break
      }

      yield result.map((k) => {
        const keyPath = k.key.split('/')
        const version = keyPath.pop()
        return {
          name: keyPath.join('/') as string,
          version: version as string,
          size: k.size,
        }
      })

      if (result.length < 1000) {
        break
      }
    }
  }

  protected async findCacheS3KeysById(
    table: string,
    keys: string[]
    // { before }: { before?: Date }
  ) {
    return this.storage.db.findS3KeysInTempTable(table, keys)
  }

  protected async *syncS3KeysToDB(
    tmpTable: string,
    bucket: string,
    { signal, before }: { signal: AbortSignal; before?: Date }
  ) {
    await this.storage.db.createS3KeysTempTable(tmpTable)

    const s3ObjectsStream = this.listAllS3Objects(bucket, {
      before,
      signal,
    })

    for await (const s3ObjectKeys of s3ObjectsStream) {
      await this.storage.db.insertS3KeysIntoTempTable(
        tmpTable,
        s3ObjectKeys.map((k) => ({
          key: k.name,
          size: k.size,
        }))
      )

      yield undefined
    }
  }

  /**
   * List all objects in the S3 bucket for a given prefix
   * yields max 1000 keys at a time
   *
   * yields at each iteration
   *
   * @param prefix
   * @param options
   * @protected
   */
  protected async *listAllS3Objects(
    prefix: string,
    options: { before?: Date; signal: AbortSignal }
  ) {
    let nextToken: string | undefined = undefined

    for (; !options.signal.aborted; ) {
      const result = await this.storage.backend.list(storageS3Bucket, {
        prefix: prefix + '/',
        nextToken,
        beforeDate: options.before,
      })

      nextToken = result.nextToken

      const keys = result.keys.filter((k) => {
        return k.name && !k.name.endsWith('.info')
      })

      if (keys.length > 0) {
        yield keys
      }

      if (!nextToken) {
        break
      }
    }
  }

  private async *deleteS3Orphans(
    tmpTable: string,
    options: {
      bucket: string
      prefix: string
      signal: AbortSignal
    }
  ) {
    const s3Keys = this.listS3Orphans(tmpTable, options)

    for await (const s3Objects of s3Keys) {
      if (options.signal.aborted) {
        break
      }

      await BackupObjectEvent.batchSend(
        s3Objects.map((obj) => {
          return new BackupObjectEvent({
            deleteOriginal: true,
            name: obj.name,
            bucketId: options.bucket,
            tenant: this.storage.db.tenant(),
            version: obj.version,
            size: obj.size,
            reqId: this.storage.db.reqId,
            sbReqId: this.storage.db.sbReqId,
          })
        })
      )

      yield s3Objects
    }
  }

  private async *listS3Orphans(
    tmpTable: string,
    options: {
      bucket: string
      prefix: string
      signal: AbortSignal
    }
  ) {
    const s3Keys = this.listAllCacheS3Keys(tmpTable, '', options.signal)

    for await (const tmpS3Objects of s3Keys) {
      if (options.signal.aborted) {
        break
      }
      // find in the db if keys exists
      const localObjs = tmpS3Objects.map((k) => ({
        name: k.name,
        version: k.version,
      }))

      if (localObjs.length === 0) {
        continue
      }

      const dbObjects = await this.storage.db.findObjectVersions(
        options.bucket,
        localObjs,
        'name,version'
      )

      const s3OrphanedKeys = tmpS3Objects.filter(
        (key) =>
          !dbObjects.find((dbKey) => dbKey.name === key.name && dbKey.version === key.version)
      )

      if (s3OrphanedKeys.length > 0) {
        // delete s3 keys
        yield s3OrphanedKeys
      }
    }
  }

  private async *listDBOrphans(
    tmpTable: string,
    options: {
      bucket: string
      before?: Date
      signal: AbortSignal
    }
  ) {
    const dbS3Objects = this.listAllDbObjects(options.bucket, {
      before: options.before,
      signal: options.signal,
    })

    for await (const dbObjects of dbS3Objects) {
      if (options.signal.aborted) {
        break
      }
      if (dbObjects.length === 0) {
        continue
      }
      const tmpS3List = await this.findCacheS3KeysById(
        tmpTable,
        dbObjects.map((o) => {
          return withOptionalVersion(o.name, o.version)
        })
      )

      const dbOrphans = dbObjects.filter(
        (key) =>
          !tmpS3List.find((tmpKey) => {
            return tmpKey.key === withOptionalVersion(key.name, key.version)
          })
      )

      if (dbOrphans.length > 0) {
        yield dbOrphans
      }
    }
  }

  private async *deleteDBOrphans(
    tmpTable: string,
    options: {
      bucket: string
      prefix: string
      before?: Date
      signal: AbortSignal
    }
  ) {
    const orphans = this.listDBOrphans(tmpTable, {
      ...options,
      before: options.before,
    })
    for await (const dbObjects of orphans) {
      if (dbObjects.length > 0) {
        const objectVersions = dbObjects.filter((o) => o.version) as {
          name: string
          version: string
        }[]

        if (objectVersions.length > 0) {
          await this.storage.db.deleteObjectVersions(options.bucket, objectVersions)
        }

        yield dbObjects
      }
    }
  }
}
