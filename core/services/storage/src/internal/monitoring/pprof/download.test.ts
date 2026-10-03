import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { gzipSync } from 'node:zlib'
import { writePprofCaptureToFile } from './download'

describe('writePprofCaptureToFile', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pprof-download-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('writes gzipped pprof data using a safe response filename', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
    const profile = gzipSync('profile-data')
    const result = await writePprofCaptureToFile(
      Readable.from([profile.subarray(0, 1), profile.subarray(1)]),
      {
        contentDisposition: 'attachment; filename="../cpu.pprof.gz"',
        type: 'profile',
      }
    )

    expect(result.outputPath).toBe(path.join(tempDir, 'dist', 'cpu.pprof.gz'))
    await expect(fs.readFile(result.outputPath)).resolves.toEqual(profile)
  })

  it('uses an explicit output path', async () => {
    const outputPath = path.join(tempDir, 'chosen', 'heap.pprof.gz')
    const profile = gzipSync('heap-data')
    const result = await writePprofCaptureToFile(
      Readable.from([profile]),
      { type: 'heap' },
      { outputPath }
    )

    expect(result.outputPath).toBe(outputPath)
    await expect(fs.readFile(outputPath)).resolves.toEqual(profile)
  })

  it('validates full heap snapshots while streaming them', async () => {
    const outputPath = path.join(tempDir, 'heap.heapsnapshot')
    await writePprofCaptureToFile(
      Readable.from([' {', '"snapshot":true', '} ']),
      { type: 'heap-snapshot' },
      { outputPath }
    )
    await expect(fs.readFile(outputPath, 'utf8')).resolves.toBe(' {"snapshot":true} ')
  })

  it('rejects empty profiles and incomplete heap snapshots', async () => {
    await expect(
      writePprofCaptureToFile(
        Readable.from([]),
        { type: 'profile' },
        { outputPath: path.join(tempDir, 'empty') }
      )
    ).rejects.toThrow('Pprof response was empty.')
    await expect(
      writePprofCaptureToFile(
        Readable.from(['{"snapshot":true']),
        { type: 'heap-snapshot' },
        { outputPath: path.join(tempDir, 'truncated') }
      )
    ).rejects.toThrow('Heap snapshot response is not a complete JSON object.')
    await expect(fs.stat(path.join(tempDir, 'empty'))).rejects.toThrow()
    await expect(fs.stat(path.join(tempDir, 'truncated'))).rejects.toThrow()
  })

  it.each([
    ['plain bytes', Buffer.from('profile-data')],
    ['a truncated gzip header', Buffer.from([0x1f])],
  ])('rejects pprof data without a complete gzip header: %s', async (_name, profile) => {
    const outputPath = path.join(tempDir, `invalid-${profile.length}`)

    await expect(
      writePprofCaptureToFile(Readable.from([profile]), { type: 'profile' }, { outputPath })
    ).rejects.toThrow('Pprof response is not gzip data.')
    await expect(fs.stat(outputPath)).rejects.toThrow()
  })

  it('preserves an existing output file when capture validation fails', async () => {
    const outputPath = path.join(tempDir, 'existing.pprof.gz')
    await fs.writeFile(outputPath, 'existing-profile')

    await expect(
      writePprofCaptureToFile(
        Readable.from(['invalid-profile']),
        { type: 'profile' },
        { outputPath }
      )
    ).rejects.toThrow('Pprof response is not gzip data.')

    await expect(fs.readFile(outputPath, 'utf8')).resolves.toBe('existing-profile')
    expect((await fs.readdir(tempDir)).filter((entry) => entry.endsWith('.tmp'))).toEqual([])
  })

  it('never recursively removes a directory passed as the output path', async () => {
    const outputPath = path.join(tempDir, 'existing-directory')
    const sentinelPath = path.join(outputPath, 'keep.txt')
    await fs.mkdir(outputPath)
    await fs.writeFile(sentinelPath, 'keep')

    await expect(
      writePprofCaptureToFile(
        Readable.from(['{"snapshot":true']),
        { type: 'heap-snapshot' },
        { outputPath }
      )
    ).rejects.toThrow('Heap snapshot response is not a complete JSON object.')

    await expect(fs.readFile(sentinelPath, 'utf8')).resolves.toBe('keep')
    expect((await fs.readdir(tempDir)).filter((entry) => entry.endsWith('.tmp'))).toEqual([])
  })
})
