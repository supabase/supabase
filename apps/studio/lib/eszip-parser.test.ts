import { Parser } from '@deno/eszip'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseEszip } from './eszip-parser'

vi.mock('@deno/eszip', () => ({
  Parser: {
    createInstance: vi.fn(),
  },
}))

vi.stubGlobal(
  'File',
  class MockFile {
    name: string
    content: string

    constructor(content: string[], name: string) {
      this.name = name
      this.content = content[0]
    }

    async text() {
      return this.content
    }
  }
)

vi.stubGlobal(
  'URL',
  class MockURL {
    pathname: string

    constructor(url: string) {
      this.pathname = url
    }
  }
)

describe('eszip-parser', () => {
  const mockParser = {
    parseBytes: vi.fn(),
    load: vi.fn(),
    getModuleSource: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(Parser.createInstance as any).mockResolvedValue(mockParser)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('parseEszip', () => {
    it('should successfully parse and extract files from eszip', async () => {
      const mockBytes = new Uint8Array([1, 2, 3])
      const mockSpecifiers = ['file1.ts', 'file2.ts']
      const mockModuleSource1 = 'export const hello = "world"'
      const mockModuleSource2 = 'export const foo = "bar"'

      mockParser.parseBytes.mockResolvedValue(mockSpecifiers)
      mockParser.load.mockResolvedValue(undefined)
      mockParser.getModuleSource
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockModuleSource1)
        .mockResolvedValueOnce(mockModuleSource2)

      const result = await parseEszip(mockBytes)

      expect(Parser.createInstance).toHaveBeenCalledTimes(1)
      expect(mockParser.parseBytes).toHaveBeenCalledWith(mockBytes)
      expect(mockParser.load).toHaveBeenCalled()
      expect(result.version).toEqual(0)
      expect(result.files).toHaveLength(2)
      expect(result.files[0]).toEqual({
        name: 'file1.ts',
        content: mockModuleSource1,
      })
      expect(result.files[1]).toEqual({
        name: 'file2.ts',
        content: mockModuleSource2,
      })
    })

    it('should handle parseBytes failure', async () => {
      mockParser.parseBytes.mockRejectedValue(new Error('Parse error'))
      await expect(parseEszip(new Uint8Array())).rejects.toThrow('Parse error')
    })

    it('should handle load failure', async () => {
      mockParser.parseBytes.mockResolvedValue(['file1.ts'])
      mockParser.load.mockRejectedValue(new Error('Load error'))

      await expect(parseEszip(new Uint8Array())).rejects.toThrow('Load error')
    })

    it('should filter out unwanted specifiers', async () => {
      const mockBytes = new Uint8Array([1, 2, 3])
      const mockSpecifiers = [
        'file1.ts',
        'npm:package',
        'https://example.com/file.ts',
        'file2.ts',
        '---internal',
        'jsr:package',
      ]
      const mockModuleSource = 'export const test = "test"'

      mockParser.parseBytes.mockResolvedValue(mockSpecifiers)
      mockParser.load.mockResolvedValue(undefined)
      mockParser.getModuleSource.mockResolvedValue(mockModuleSource)

      const result = await parseEszip(mockBytes)
      // Only file1.ts and file2.ts should be included
      expect(result.version).toEqual(0)
      expect(result.files).toHaveLength(2)
      expect(result.files[0].name).toBe('file1.ts')
      expect(result.files[1].name).toBe('file2.ts')
    })
  })
})
