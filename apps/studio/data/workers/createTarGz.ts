const BLOCK_SIZE = 512

export interface TarFile {
  name: string
  content: string
}

const writeAscii = (block: Uint8Array, offset: number, value: string) => {
  for (let i = 0; i < value.length; i++) block[offset + i] = value.charCodeAt(i)
}

// Octal, NUL-terminated, right-aligned and zero-padded, as the ustar header expects.
const writeOctal = (block: Uint8Array, offset: number, value: number, length: number) =>
  writeAscii(block, offset, value.toString(8).padStart(length - 1, '0') + '\0')

const buildHeader = (name: string, size: number): Uint8Array => {
  const header = new Uint8Array(BLOCK_SIZE)
  writeAscii(header, 0, name)
  writeOctal(header, 100, 0o644, 8)
  writeOctal(header, 108, 0, 8)
  writeOctal(header, 116, 0, 8)
  writeOctal(header, 124, size, 12)
  writeOctal(header, 136, 0, 12)
  header[156] = '0'.charCodeAt(0)
  writeAscii(header, 257, 'ustar\0')
  writeAscii(header, 263, '00')

  // The checksum is the sum of every header byte with the checksum field itself read as spaces.
  header.fill(32, 148, 156)
  const checksum = header.reduce((total, byte) => total + byte, 0)
  writeAscii(header, 148, checksum.toString(8).padStart(6, '0') + '\0 ')

  return header
}

const padToBlock = (length: number) => (BLOCK_SIZE - (length % BLOCK_SIZE)) % BLOCK_SIZE

export const createTar = (files: TarFile[]): Uint8Array<ArrayBuffer> => {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []

  for (const file of files) {
    const content = encoder.encode(file.content)
    parts.push(buildHeader(file.name, content.length), content)
    const padding = padToBlock(content.length)
    if (padding > 0) parts.push(new Uint8Array(padding))
  }

  // Two zero blocks mark the end of the archive.
  parts.push(new Uint8Array(BLOCK_SIZE * 2))

  const total = parts.reduce((size, part) => size + part.length, 0)
  const tar = new Uint8Array(new ArrayBuffer(total))
  let offset = 0
  for (const part of parts) {
    tar.set(part, offset)
    offset += part.length
  }
  return tar
}

export const createTarGz = async (files: TarFile[]): Promise<Blob> => {
  const tar = createTar(files)
  const gzip = new CompressionStream('gzip')
  const stream = new Blob([tar]).stream().pipeThrough(gzip)
  return new Response(stream).blob()
}
