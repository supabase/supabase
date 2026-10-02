import { Transform, TransformCallback } from 'stream'
import { StringDecoder } from 'string_decoder'

export class NdJsonTransform extends Transform {
  private decoder = new StringDecoder('utf8')
  private buffer = ''

  constructor() {
    super({ readableObjectMode: true })
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    // decode safely across chunk boundaries
    this.buffer += this.decoder.write(chunk)

    let newlineIdx = this.buffer.indexOf('\n')
    while (newlineIdx !== -1) {
      const line = this.buffer.slice(0, newlineIdx)
      this.buffer = this.buffer.slice(newlineIdx + 1)
      if (line.trim()) {
        let obj: unknown
        try {
          obj = JSON.parse(line)
        } catch (err) {
          if (err instanceof Error) {
            // this is the case when JSON.parse fails
            return callback(new Error(`Invalid JSON on flush: ${err.message}`))
          }

          return callback(err as Error)
        }
        // .push() participates in backpressure automatically
        this.push(obj)
      }

      newlineIdx = this.buffer.indexOf('\n')
    }

    callback()
  }

  _flush(callback: TransformCallback) {
    this.buffer += this.decoder.end()
    if (this.buffer.trim()) {
      try {
        this.push(JSON.parse(this.buffer))
      } catch (err) {
        if (err instanceof Error) {
          // this is the case when JSON.parse fails
          return callback(new Error(`Invalid JSON on flush: ${err.message}`))
        }

        return callback(err as Error)
      }
    }
    callback()
  }
}
