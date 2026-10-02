import { mergeCacheControlDirectives } from './cache-control'

describe('mergeCacheControlDirectives', () => {
  it('should append additions not present in the base', () => {
    expect(
      mergeCacheControlDirectives(['public, max-age=3600'], ['stale-while-revalidate=120'])
    ).toEqual(['public, max-age=3600', 'stale-while-revalidate=120'])
  })

  it('should append additions to a bare no-cache base directive', () => {
    // Storage sets `no-cache` as the default object Cache-Control when no
    // max-age is provided at upload time, so this is the Cache-Control
    // value most objects actually have.
    expect(mergeCacheControlDirectives(['no-cache'], ['stale-while-revalidate=120'])).toEqual([
      'no-cache',
      'stale-while-revalidate=120',
    ])
  })

  it('should skip an addition whose directive name is already present in a plain base directive', () => {
    expect(
      mergeCacheControlDirectives(
        ['public, max-age=3600', 'stale-while-revalidate=30'],
        ['stale-while-revalidate=120']
      )
    ).toEqual(['public, max-age=3600', 'stale-while-revalidate=30'])
  })

  it('should skip an addition whose directive name is already embedded in a multi-directive base string', () => {
    expect(
      mergeCacheControlDirectives(
        ['public, max-age=3600, stale-while-revalidate=999'],
        ['stale-while-revalidate=120', 'stale-if-error=300']
      )
    ).toEqual(['public, max-age=3600, stale-while-revalidate=999', 'stale-if-error=300'])
  })

  it('should treat directive names as case-insensitive when comparing to additions', () => {
    expect(
      mergeCacheControlDirectives(['Public, Max-Age=3600'], ['max-age=60', 'no-store'])
    ).toEqual(['Public, Max-Age=3600', 'no-store'])
  })

  it('should not mistake a comma inside a quoted base value for a directive boundary', () => {
    expect(
      mergeCacheControlDirectives(
        ['private="Set-Cookie, X-Foo", stale-while-revalidate=999'],
        ['stale-while-revalidate=120', 'stale-if-error=300']
      )
    ).toEqual(['private="Set-Cookie, X-Foo", stale-while-revalidate=999', 'stale-if-error=300'])
  })

  it('should not let a backslash-escaped quote inside a base value break directive detection', () => {
    expect(
      mergeCacheControlDirectives(
        ['private="a \\"quoted\\" value", stale-while-revalidate=999'],
        ['stale-while-revalidate=120']
      )
    ).toEqual(['private="a \\"quoted\\" value", stale-while-revalidate=999'])
  })

  it('should ignore empty list elements in a base directive when detecting duplicates', () => {
    expect(
      mergeCacheControlDirectives([',, public ,, max-age=3600 ,,'], ['max-age=60', 'no-store'])
    ).toEqual([',, public ,, max-age=3600 ,,', 'no-store'])
  })

  it('should not throw on an unterminated quoted base value', () => {
    expect(
      mergeCacheControlDirectives(['private="unterminated, max-age=3600'], ['stale-if-error=300'])
    ).toEqual(['private="unterminated, max-age=3600', 'stale-if-error=300'])
  })

  it('should not corrupt output when a base value ends in a trailing backslash inside an unterminated quote', () => {
    const result = mergeCacheControlDirectives(['private="abc\\'], ['stale-if-error=300'])

    expect(result).toEqual(['private="abc\\', 'stale-if-error=300'])
    expect(result.join(', ')).not.toContain('undefined')
  })

  it('should correctly extract directive names across multiple independent quoted segments in one base value', () => {
    expect(
      mergeCacheControlDirectives(['a="x, y", b="p, q", max-age=3600'], ['max-age=60', 'no-store'])
    ).toEqual(['a="x, y", b="p, q", max-age=3600', 'no-store'])
  })

  it('should return the base unchanged, including nullish and empty entries, when there is nothing to merge', () => {
    expect(mergeCacheControlDirectives([undefined, '', 'max-age=3600'], [])).toEqual([
      undefined,
      '',
      'max-age=3600',
    ])
  })

  it('should filter nullish base entries when there are additions to merge', () => {
    expect(
      mergeCacheControlDirectives(
        [undefined, 'max-age=3600'],
        ['stale-while-revalidate=120', 'max-age=60']
      )
    ).toEqual(['max-age=3600', 'stale-while-revalidate=120'])
  })
})
