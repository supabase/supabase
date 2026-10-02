import { FastifyReply } from 'fastify'
import { AssetResponse, Renderer } from './renderer'

class TestRenderer extends Renderer {
  async getAsset(): Promise<AssetResponse> {
    return { metadata: {} as AssetResponse['metadata'] }
  }

  contentDisposition(download?: string) {
    const headers: Record<string, string> = {}
    const response = {
      header(name: string, value: string) {
        headers[name.toLowerCase()] = value
        return this
      },
    } as unknown as FastifyReply

    this.handleDownload(response, download)
    return headers['content-disposition']
  }
}

// RFC 8187 attr-char: the only characters allowed unencoded in an ext-value.
const RFC8187_EXT_VALUE = /^UTF-8''(?:[A-Za-z0-9!#$&+\-.^_`|~]|%[0-9A-F]{2})*$/

// RFC 6266 `filename` is a token or a quoted-string (RFC 9110 tchar / qdtext).
const CONTENT_DISPOSITION =
  /^attachment; filename=(?:([!#$%&'*+\-.^_`|~0-9A-Za-z]+)|"((?:[^"\\]|\\.)*)"); filename\*=(\S+)$/

function parseContentDisposition(header: string) {
  const match = CONTENT_DISPOSITION.exec(header)
  const hasControlCharacter = [...header].some((c) => c < ' ' || c === '\x7f')
  if (!match || hasControlCharacter) {
    throw new Error(`malformed Content-Disposition: ${header}`)
  }

  const [, token, quoted, extValue] = match
  return {
    filename: token ?? quoted.replace(/\\(.)/g, '$1'),
    extValue,
    decodedFilename: decodeURIComponent(extValue.slice("UTF-8''".length)),
  }
}

describe('Renderer download Content-Disposition', () => {
  const renderer = new TestRenderer()

  it('does not set Content-Disposition when download is not requested', () => {
    expect(renderer.contentDisposition(undefined)).toBeUndefined()
  })

  it('keeps the existing header for a name that is already a valid token', () => {
    expect(renderer.contentDisposition('report.pdf')).toBe(
      "attachment; filename=report.pdf; filename*=UTF-8''report.pdf"
    )
  })

  it('keeps a bare attachment disposition for an empty download name', () => {
    expect(renderer.contentDisposition('')).toBe('attachment;')
  })

  it.each([
    ['report.pdf', 'report.pdf'],
    ['my file.pdf', 'my file.pdf'],
    ["John's Resume.pdf", "John's Resume.pdf"],
    ['report(1).pdf', 'report(1).pdf'],
    ['a*b.txt', 'a*b.txt'],
    ['a"b\\c.txt', 'a_b_c.txt'],
    ['a\x7fb.txt', 'a_b.txt'],
    ['😀.png', '_.png'],
  ])('encodes the name %j so both parameters decode correctly', (download, fallback) => {
    const header = renderer.contentDisposition(download)
    const parsed = parseContentDisposition(header)

    expect(parsed.extValue).toMatch(RFC8187_EXT_VALUE)
    expect(parsed.decodedFilename).toBe(download)
    expect(parsed.filename).toBe(fallback)
  })

  it('percent-encodes non-ASCII names in filename* and uses an ASCII fallback in filename', () => {
    const header = renderer.contentDisposition('naïve café.txt')
    const parsed = parseContentDisposition(header)

    expect(parsed.extValue).toMatch(RFC8187_EXT_VALUE)
    expect(parsed.decodedFilename).toBe('naïve café.txt')
    expect(parsed.filename).toBe('na_ve caf_.txt')
  })

  it('keeps control characters out of the header value', () => {
    const header = renderer.contentDisposition('evil\r\nSet-Cookie: a=b.txt')

    expect(header).not.toMatch(/[\r\n]/)
    const parsed = parseContentDisposition(header)
    expect(parsed.extValue).toMatch(RFC8187_EXT_VALUE)
    expect(parsed.decodedFilename).toBe('evil\r\nSet-Cookie: a=b.txt')
  })
})
