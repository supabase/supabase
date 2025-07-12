import { TextDecoder, TextEncoder } from 'node:util'
import { ReadableStream, TransformStream } from 'node:stream/web'

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  CSS: {
    value: {
      supports: (_k: any, _v: any) => false,
      escape: (v: any) => v,
    },
  },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
})
