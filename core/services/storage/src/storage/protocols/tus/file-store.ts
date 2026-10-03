import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type http from 'node:http'
import stream from 'node:stream'
import { ErrorCode, StorageBackendError } from '@internal/errors'
import { ensureFile } from '@internal/fs'
import { FileBackend, resolveSecureFilesystemPath } from '@storage/backend'
import { Configstore, FileStore as TusFileStore } from '@tus/file-store'
import { Upload } from '@tus/server'
import { ERRORS as TUS_ERRORS } from '@tus/utils'

const DELETE_EXPIRED_CONCURRENCY = 32

export type FileStoreOptions = {
  directory: string
  configstore?: Configstore
  expirationPeriodInMilliseconds?: number
}

export class FileStore extends TusFileStore {
  protected fileAdapter: FileBackend

  constructor(protected readonly options: FileStoreOptions) {
    super(options)
    this.fileAdapter = new FileBackend()
  }

  read(fileId: string) {
    return fs.createReadStream(this.resolveUploadPath(fileId))
  }

  async create(file: Upload): Promise<Upload> {
    const filePath = this.resolveUploadPath(file.id)
    await ensureFile(filePath)

    await this.fileAdapter.setFileMetadata(filePath, {
      cacheControl: file.metadata?.cacheControl || '',
      contentType: file.metadata?.contentType || '',
    })
    await this.configstore.set(file.id, file)

    file.storage = { type: 'file', path: filePath }
    return file
  }

  async remove(fileId: string): Promise<void> {
    const filePath = this.resolveUploadPath(fileId)

    try {
      await fsp.unlink(filePath)
    } catch (error) {
      if (!this.isErrnoException(error) || error.code !== 'ENOENT') {
        throw error
      }

      await this.deleteConfigstoreEntryBestEffort(fileId)
      throw TUS_ERRORS.FILE_NOT_FOUND
    }

    await this.configstore.delete(fileId)
  }

  write(
    readable: http.IncomingMessage | stream.Readable,
    fileId: string,
    offset: number
  ): Promise<number> {
    const filePath = this.resolveUploadPath(fileId)
    const writable = fs.createWriteStream(filePath, {
      flags: 'r+',
      start: offset,
    })

    let bytesReceived = 0
    const transform = new stream.Transform({
      transform(chunk, _, callback) {
        bytesReceived += chunk.length
        callback(null, chunk)
      },
    })

    return new Promise((resolve, reject) => {
      stream.pipeline(readable, transform, writable, (err) => {
        if (err) {
          return reject(TUS_ERRORS.FILE_WRITE_ERROR)
        }

        resolve(offset + bytesReceived)
      })
    })
  }

  async getUpload(id: string): Promise<Upload> {
    const filePath = this.resolveUploadPath(id)
    const file = await this.configstore.get(id)

    if (!file) {
      throw TUS_ERRORS.FILE_NOT_FOUND
    }

    try {
      const stats = await fsp.stat(filePath)

      if (stats.isDirectory()) {
        throw TUS_ERRORS.FILE_NOT_FOUND
      }

      return new Upload({
        id,
        size: file.size,
        offset: stats.size,
        metadata: file.metadata,
        creation_date: file.creation_date,
        storage: { type: 'file', path: filePath },
      })
    } catch (error) {
      if (this.isErrnoException(error) && error.code === 'ENOENT') {
        throw TUS_ERRORS.FILE_NO_LONGER_EXISTS
      }

      throw error
    }
  }

  async declareUploadLength(id: string, uploadLength: number) {
    this.validateUploadId(id)

    const file = await this.configstore.get(id)

    if (!file) {
      throw TUS_ERRORS.FILE_NOT_FOUND
    }

    file.size = uploadLength
    await this.configstore.set(id, file)
  }

  async deleteExpired(): Promise<number> {
    const now = new Date()
    const expiredUploadIds: string[] = []

    if (!this.configstore.list) {
      throw TUS_ERRORS.UNSUPPORTED_EXPIRATION_EXTENSION
    }

    const uploadKeys = await this.configstore.list()

    for (const fileId of uploadKeys) {
      let filePath: string

      try {
        filePath = this.resolveUploadPath(fileId)
      } catch (error) {
        if (this.isInvalidUploadIdError(error)) {
          continue
        }

        throw error
      }

      try {
        const info = await this.configstore.get(fileId)

        if (info && 'creation_date' in info && this.getExpiration() > 0 && info.creation_date) {
          const creation = new Date(info.creation_date)
          const expires = new Date(creation.getTime() + this.getExpiration())

          if (now > expires) {
            try {
              const stats = await fsp.stat(filePath)

              if (!stats.isDirectory() && (info.size === undefined || info.size !== stats.size)) {
                expiredUploadIds.push(fileId)
              }
            } catch (error) {
              if (this.isErrnoException(error) && error.code === 'ENOENT') {
                await this.deleteConfigstoreEntryBestEffort(fileId)
                continue
              }

              throw error
            }
          }
        }
      } catch (error) {
        if (error !== TUS_ERRORS.FILE_NO_LONGER_EXISTS) {
          throw error
        }
      }
    }

    let nextUploadIndex = 0
    const workers = Array.from(
      { length: Math.min(DELETE_EXPIRED_CONCURRENCY, expiredUploadIds.length) },
      async () => {
        while (nextUploadIndex < expiredUploadIds.length) {
          const uploadId = expiredUploadIds[nextUploadIndex++]
          try {
            await this.remove(uploadId)
          } catch (error) {
            if (error !== TUS_ERRORS.FILE_NOT_FOUND) {
              throw error
            }
          }
        }
      }
    )

    await Promise.all(workers)
    return expiredUploadIds.length
  }

  private resolveUploadPath(fileId: string): string {
    return resolveSecureFilesystemPath(this.options.directory, fileId)
  }

  private validateUploadId(fileId: string): void {
    this.resolveUploadPath(fileId)
  }

  private isInvalidUploadIdError(error: unknown): boolean {
    return error instanceof StorageBackendError && error.code === ErrorCode.InvalidKey
  }

  private isErrnoException(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error
  }

  private async deleteConfigstoreEntryBestEffort(fileId: string): Promise<void> {
    try {
      await this.configstore.delete(fileId)
    } catch {
      // best-effort orphan cleanup; later attempts can retry if metadata removal fails
    }
  }
}
