import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import {
  extractZipFile,
  isBinaryFile,
} from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.utils'

// The editor stores text as Unicode strings and binary files as byte strings.
const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>café 日本語 🎨</text></svg>'

describe('isBinaryFile', () => {
  test.each(['icon.svg', 'ICON.SVG', 'assets/icon.svg'])('treats %s as text', (filename) => {
    expect(isBinaryFile(filename)).toBe(false)
  })

  test.each(['module.wasm', 'image.png', 'image.jpg', 'document.pdf', 'archive.zip'])(
    'continues treating %s as binary',
    (filename) => {
      expect(isBinaryFile(filename)).toBe(true)
    }
  )
})

describe('extractZipFile', () => {
  // jsdom's Blob/File do not implement arrayBuffer(), which zip.js uses.
  beforeAll(() => {
    vi.stubGlobal('Blob', NodeBlob)
    vi.stubGlobal('File', NodeFile)
  })
  afterAll(() => vi.unstubAllGlobals())

  test('preserves UTF-8 SVG text through ZIP extraction and deployment serialization', async () => {
    const writer = new ZipWriter(new BlobWriter('application/zip'))
    await writer.add('assets/icon.svg', new TextReader(svg), { level: 0 })
    const archive = await writer.close()

    const files = await extractZipFile(new File([archive], 'function.zip'))

    expect(files).toEqual([
      { name: 'assets/icon.svg', content: svg, size: new TextEncoder().encode(svg).length },
    ])
    // Edge Function deployment constructs each multipart file from its string content.
    const deployed = new Blob([files[0].content], { type: 'text/plain' })
    expect(Array.from(new Uint8Array(await deployed.arrayBuffer()))).toEqual(
      Array.from(new TextEncoder().encode(svg))
    )
  })
})
