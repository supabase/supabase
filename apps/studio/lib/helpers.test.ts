import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  tryParseJson,
  minifyJSON,
  prettifyJSON,
  removeJSONTrailingComma,
  timeout,
  getURL,
  makeRandomString,
  pluckObjectFields,
  tryParseInt,
  propsAreEqual,
  formatBytes,
  snakeToCamel,
  copyToClipboard,
  detectBrowser,
  detectOS,
  pluralize,
  isValidHttpUrl,
  removeCommentsFromSql,
  getSemanticVersion,
  getDatabaseMajorVersion,
  getDistanceLatLonKM,
  formatCurrency,
} from './helpers'

describe('tryParseJson', () => {
  it('should return the parsed JSON', () => {
    const result = tryParseJson('{"test": "test"}')

    expect(result).toEqual({ test: 'test' })
  })
})

describe('minifyJSON', () => {
  it('should return the minified JSON', () => {
    const result = minifyJSON('{"test": "test"}')

    expect(result).toEqual(`{"test":"test"}`)
  })
})

describe('prettifyJSON', () => {
  it('should return the prettified JSON', () => {
    const result = prettifyJSON('{"test": "test"}')

    expect(result).toEqual(`{
  "test": "test"
}`)
  })
})

describe('removeJSONTrailingComma', () => {
  it('should return the JSON without a trailing comma', () => {
    const result = removeJSONTrailingComma('{"test":"test",}')

    expect(result).toEqual('{"test":"test"}')
  })
})

describe('timeout', () => {
  it('resolves after given ms', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()

    timeout(1000).then(spy)

    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    await vi.runAllTimersAsync()

    expect(spy).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('getURL', () => {
  it('should return prod url by default', () => {
    const result = getURL()

    expect(result).toEqual('https://supabase.com/dashboard')
  })
})

describe('makeRandomString', () => {
  it('should return a random string of the given length', () => {
    const result = makeRandomString(10)

    expect(result).toHaveLength(10)
  })
})

describe('pluckObjectFields', () => {
  it('should return a new object with the specified fields', () => {
    const result = pluckObjectFields({ a: 1, b: 2, c: 3 }, ['a', 'c'])

    expect(result).toEqual({ a: 1, c: 3 })
  })
})

describe('tryParseInt', () => {
  it('should return the parsed integer', () => {
    const result = tryParseInt('123')

    expect(result).toEqual(123)
  })

  it('should return undefined if the string is not a number', () => {
    const result = tryParseInt('not a number')

    expect(result).toBeUndefined()
  })
})

describe('propsAreEqual', () => {
  it('should return true if the props are equal', () => {
    const result = propsAreEqual({ a: 1, b: 2 }, { a: 1, b: 2 })

    expect(result).toBe(true)
  })

  it('should return false if the props are not equal', () => {
    const result = propsAreEqual({ a: 1, b: 2 }, { a: 1, b: 3 })
  })
})

describe('formatBytes', () => {
  it('should return the formatted bytes', () => {
    const result = formatBytes(1024)

    expect(result).toEqual('1 KB')
  })

  it('should return the formatted bytes in MB', () => {
    const result = formatBytes(1024 * 1024)

    expect(result).toEqual('1 MB')
  })
})

describe('snakeToCamel', () => {
  it('should convert snake_case to camelCase', () => {
    const result = snakeToCamel('snake_case')

    expect(result).toEqual('snakeCase')
  })
})

describe('copyToClipboard', () => {
  let writeMock: any
  let writeTextMock: any
  let hasFocusMock: any

  beforeEach(() => {
    writeMock = vi.fn().mockResolvedValue(undefined)
    writeTextMock = vi.fn().mockResolvedValue(undefined)
    hasFocusMock = vi.fn().mockReturnValue(true)

    vi.stubGlobal('navigator', {
      clipboard: {
        write: writeMock,
        writeText: writeTextMock,
      },
    })

    vi.stubGlobal('window', {
      document: {
        hasFocus: hasFocusMock,
      },
    })

    // If ClipboardItem is used
    vi.stubGlobal('ClipboardItem', function (items: any) {
      return items
    })

    // Prevent toast errors
    vi.stubGlobal('toast', { error: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses clipboard.write if available', async () => {
    await copyToClipboard('hello')
    expect(writeMock).toHaveBeenCalled()
  })

  it('falls back to writeText if clipboard.write not available', async () => {
    ;(navigator.clipboard as any).write = undefined
    await copyToClipboard('hello')
    expect(writeTextMock).toHaveBeenCalledWith('hello')
  })
})

describe('detectBrowser', () => {
  const originalNavigator = global.navigator

  const setUserAgent = (ua: string) => {
    vi.stubGlobal('navigator', { userAgent: ua })
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    global.navigator = originalNavigator
  })

  it('detects Chrome', () => {
    setUserAgent('Mozilla/5.0 Chrome/90.0.0.0 Safari/537.36')
    expect(detectBrowser()).toBe('Chrome')
  })

  it('detects Firefox', () => {
    setUserAgent('Mozilla/5.0 Firefox/88.0')
    expect(detectBrowser()).toBe('Firefox')
  })

  it('detects Safari', () => {
    setUserAgent('Mozilla/5.0 Version/14.0 Safari/605.1.15')
    expect(detectBrowser()).toBe('Safari')
  })

  it('returns undefined when navigator is not defined', () => {
    vi.stubGlobal('navigator', undefined)
    expect(detectBrowser()).toBeUndefined()
  })
})

describe('detectOS', () => {
  const mockUserAgent = (ua: string) => {
    vi.stubGlobal('window', {
      navigator: { userAgent: ua },
    })
    vi.stubGlobal('navigator', { userAgent: ua }) // some code may use both
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects macOS', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    expect(detectOS()).toBe('macos')
  })

  it('detects Windows', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    expect(detectOS()).toBe('windows')
  })

  it('returns undefined for unknown OS', () => {
    mockUserAgent('Mozilla/5.0 (X11; Linux x86_64)')
    expect(detectOS()).toBeUndefined()
  })

  it('returns undefined if window is undefined', () => {
    vi.stubGlobal('window', undefined)
    expect(detectOS()).toBeUndefined()
  })

  it('returns undefined if navigator is undefined', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', undefined)
    expect(detectOS()).toBeUndefined()
  })
})

describe('pluralize', () => {
  it('should return the pluralized word', () => {
    const result = pluralize(2, 'test', 'tests')

    expect(result).toEqual('tests')
  })
})

describe('isValidHttpUrl', () => {
  it('should return true if the URL is valid', () => {
    const result = isValidHttpUrl('https://supabase.com')

    expect(result).toBe(true)
  })

  it('should return false if the URL is not valid', () => {
    const result = isValidHttpUrl('not a url')

    expect(result).toBe(false)
  })
})

describe('removeCommentsFromSql', () => {
  it('should remove comments from SQL', () => {
    const result = removeCommentsFromSql(`-- This is a comment
SELECT * FROM users
        `)

    expect(result).toEqual(`
SELECT * FROM users
        `)
  })
})

describe('getSemanticVersion', () => {
  it('should return the semantic version', () => {
    const result = getSemanticVersion('supabase-postgres-14.1.0.88')

    expect(result).toEqual(141088)
  })
})

describe('getDatabaseMajorVersion', () => {
  it('should return the database major version', () => {
    const result = getDatabaseMajorVersion('supabase-postgres-14.1.0.88')

    expect(result).toEqual(14)
  })
})

describe('getDistanceLatLonKM', () => {
  it('should return the distance in kilometers', () => {
    const result = getDistanceLatLonKM(37.774929, -122.419418, 37.774929, -122.419418)

    expect(result).toEqual(0)
  })
})

describe('formatCurrency', () => {
  it('should return the formatted currency', () => {
    const result = formatCurrency(1000)

    expect(result).toEqual('$1,000.00')
  })

  it('should return the formatted currency with small values', () => {
    const result = formatCurrency(0.001)

    expect(result).toEqual('$0')
  })

  it('should return null if the value is undefined', () => {
    const result = formatCurrency(undefined)

    expect(result).toEqual(null)
  })
})
