const { TextDecoder, TextEncoder } = require('node:util')

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  CSS: {
    value: {
      supports: (k, v) => false,
      escape: (v) => v,
    },
  },
  TransformStream: { value: null },
})
