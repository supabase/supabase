import { Transform, TransformCallback } from 'node:stream'

export const createByteCounterStream = () => {
  let bytes = 0

  const transformStream = new Transform({
    transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
      bytes += chunk.length
      callback(null, chunk)
    },
  })

  return {
    transformStream,
    get bytes() {
      return bytes
    },
  }
}

export class RequestByteCounterStream extends Transform {
  public receivedEncodedLength = 0

  _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
    this.receivedEncodedLength += chunk.length

    cb(null, chunk)
  }
}
