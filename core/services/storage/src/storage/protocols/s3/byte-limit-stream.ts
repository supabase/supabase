import { ERRORS } from '@internal/errors'
import { Transform, TransformCallback } from 'stream'

export class ByteLimitTransformStream extends Transform {
  bytesProcessed = 0

  constructor(
    private readonly limit: number,
    private readonly minimum = 0
  ) {
    super()
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    this.bytesProcessed += chunk.length

    if (this.bytesProcessed > this.limit) {
      callback(ERRORS.EntityTooLarge())
    } else {
      callback(null, chunk)
    }
  }

  // Checked before the stream ends, so the upload reading from it fails rather
  // than storing an object smaller than the caller allowed.
  _flush(callback: TransformCallback) {
    if (this.bytesProcessed < this.minimum) {
      callback(ERRORS.EntityTooSmall())
    } else {
      callback()
    }
  }
}
