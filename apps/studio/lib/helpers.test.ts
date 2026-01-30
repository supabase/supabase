import { copyToClipboard } from 'ui'
import { v4 as _uuidV4 } from 'uuid'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  detectBrowser,
  detectOS,
  extractUrls,
  formatBytes,
  formatCurrency,
  getDatabaseMajorVersion,
  getDistanceLatLonKM,
  getSemanticVersion,
  getURL,
  isValidHttpUrl,
  makeRandomString,
  minifyJSON,
  pluckObjectFields,
  pluralize,
  prettifyJSON,
  propsAreEqual,
  removeCommentsFromSql,
  removeJSONTrailingComma,
  snakeToCamel,
  stripMarkdownCodeBlocks,
  tablesToSQL,
  timeout,
  tryParseInt,
  tryParseJson,
  uuidv4,
} from './helpers'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid'),
}))

describe('uuidv4', () => {
  it('calls uuid.v4 and returns the result', () => {
    const result = uuidv4()
    expect(_uuidV4).toHaveBeenCalled()
    expect(result).toBe('mocked-uuid')
  })
})

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

    // CopyToClipboard uses setTimeout to call the callback
    vi.useFakeTimers()

    // If ClipboardItem is used
    vi.stubGlobal('ClipboardItem', function (items: any) {
      return items
    })

    // Prevent toast errors
    vi.stubGlobal('toast', { error: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('uses clipboard.write if available', async () => {
    await copyToClipboard('hello')
    vi.runAllTimers()
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

describe('extractUrls', () => {
  it('should extract basic http URLs', () => {
    const result = extractUrls('Visit http://example.com for more info')
    expect(result).toEqual(['http://example.com'])
  })

  it('should extract basic https URLs', () => {
    const result = extractUrls('Check out https://supabase.com')
    expect(result).toEqual(['https://supabase.com'])
  })

  it('should extract URLs with ports', () => {
    const result = extractUrls('Connect to http://localhost:3000')
    expect(result).toEqual(['http://localhost:3000'])
  })

  it('should extract URLs with paths', () => {
    const result = extractUrls('Go to https://example.com/path/to/page')
    expect(result).toEqual(['https://example.com/path/to/page'])
  })

  it('should extract URLs with query parameters', () => {
    const result = extractUrls('Visit https://example.com/search?q=test&page=1')
    expect(result).toEqual(['https://example.com/search?q=test&page=1'])
  })

  it('should extract URLs with fragments', () => {
    const result = extractUrls('See https://example.com/page#section')
    expect(result).toEqual(['https://example.com/page#section'])
  })

  it('should extract URLs with complex paths, query params, and fragments', () => {
    const result = extractUrls('Check https://example.com/api/v1/users?id=123&name=test#details')
    expect(result).toEqual(['https://example.com/api/v1/users?id=123&name=test#details'])
  })

  it('should extract multiple URLs from text', () => {
    const result = extractUrls('Visit http://example.com and https://supabase.com for more info')
    expect(result).toEqual(['http://example.com', 'https://supabase.com'])
  })

  it('should remove trailing punctuation from URLs', () => {
    const result = extractUrls('Visit https://example.com.')
    expect(result).toEqual(['https://example.com'])
  })

  it('should remove multiple trailing punctuation marks', () => {
    const result = extractUrls('Check https://example.com!!!')
    expect(result).toEqual(['https://example.com'])
  })

  it('should remove trailing punctuation including parentheses', () => {
    const result = extractUrls('See (https://example.com)')
    expect(result).toEqual(['https://example.com'])
  })

  it('should handle URLs with trailing commas and periods', () => {
    const result = extractUrls('Visit https://example.com, and https://supabase.com.')
    expect(result).toEqual(['https://example.com', 'https://supabase.com'])
  })

  it('should handle URLs with subpath and markdown bolding', () => {
    const result = extractUrls('Check out **https://example.com/subpath** for details')
    expect(result).toEqual(['https://example.com/subpath'])
  })

  it('should return empty array when no URLs are found', () => {
    const result = extractUrls('This is just plain text with no URLs')
    expect(result).toEqual([])
  })

  it('should return empty array for empty string', () => {
    const result = extractUrls('')
    expect(result).toEqual([])
  })

  it('should handle URLs in parentheses', () => {
    const result = extractUrls('Check out (https://example.com) for details')
    expect(result).toEqual(['https://example.com'])
  })

  it('should be case insensitive for protocol', () => {
    const result = extractUrls('Visit HTTP://EXAMPLE.COM and HTTPS://SUPABASE.COM')
    expect(result).toEqual(['HTTP://EXAMPLE.COM', 'HTTPS://SUPABASE.COM'])
  })

  it('should handle URLs with special characters in path', () => {
    const result = extractUrls('Visit https://example.com/path_with_underscores/file-name.txt')
    expect(result).toEqual(['https://example.com/path_with_underscores/file-name.txt'])
  })

  it('should handle URLs with encoded characters', () => {
    const result = extractUrls('Visit https://example.com/search?q=hello%20world')
    expect(result).toEqual(['https://example.com/search?q=hello%20world'])
  })

  it('should handle URLs with subdomains', () => {
    const result = extractUrls('Visit https://www.example.com and https://api.example.com')
    expect(result).toEqual(['https://www.example.com', 'https://api.example.com'])
  })

  describe('with excludeCodeBlocks option', () => {
    it('should exclude URLs in fenced code blocks', () => {
      const text = 'Visit https://real.com\n```\nhttps://code.com\n```'
      expect(extractUrls(text, { excludeCodeBlocks: true })).toEqual(['https://real.com'])
    })

    it('should exclude URLs in fenced code blocks with language specifier', () => {
      const text = 'Visit https://real.com\n```sql\nSELECT * FROM https://code.com\n```'
      expect(extractUrls(text, { excludeCodeBlocks: true })).toEqual(['https://real.com'])
    })

    it('should exclude URLs in inline code', () => {
      const text = 'Use `https://code.com` for the endpoint, or visit https://real.com'
      expect(extractUrls(text, { excludeCodeBlocks: true })).toEqual(['https://real.com'])
    })

    it('should handle multiple code blocks', () => {
      const text =
        'https://first.com\n```\nhttps://code1.com\n```\nhttps://second.com\n```\nhttps://code2.com\n```'
      expect(extractUrls(text, { excludeCodeBlocks: true })).toEqual([
        'https://first.com',
        'https://second.com',
      ])
    })

    it('should not exclude code blocks by default', () => {
      const text = 'Visit https://real.com\n```\nhttps://code.com\n```'
      expect(extractUrls(text)).toEqual(['https://real.com', 'https://code.com'])
    })
  })

  describe('with excludeTemplates option', () => {
    it('should not extract URLs with angle brackets in subdomain', () => {
      // Angle brackets in subdomain prevent the URL from being extracted at all
      const text = 'Visit https://real.com or https://<project-ref>.supabase.co'
      expect(extractUrls(text, { excludeTemplates: true })).toEqual(['https://real.com'])
    })

    it('should exclude URLs truncated at angle brackets in path', () => {
      // The regex stops at angle brackets - exclude the whole truncated URL
      const text = 'Visit https://real.com or https://example.com/api/<project-id>/data'
      expect(extractUrls(text, { excludeTemplates: true })).toEqual(['https://real.com'])
    })

    it('should keep URLs without angle brackets', () => {
      const text = 'Visit https://example.com/path_with_underscores'
      expect(extractUrls(text, { excludeTemplates: true })).toEqual([
        'https://example.com/path_with_underscores',
      ])
    })
  })

  describe('with both options', () => {
    it('should exclude both code blocks and template URLs', () => {
      const text =
        'Visit https://real.com\n```\nhttps://code.com\n```\nOr https://<project-ref>.supabase.co'
      expect(extractUrls(text, { excludeCodeBlocks: true, excludeTemplates: true })).toEqual([
        'https://real.com',
      ])
    })
  })
})

describe('stripMarkdownCodeBlocks', () => {
  it('should remove fenced code blocks', () => {
    const text = 'Before\n```\ncode here\n```\nAfter'
    expect(stripMarkdownCodeBlocks(text)).toBe('Before\n\nAfter')
  })

  it('should remove fenced code blocks with language specifier', () => {
    const text = 'Before\n```typescript\nconst x = 1;\n```\nAfter'
    expect(stripMarkdownCodeBlocks(text)).toBe('Before\n\nAfter')
  })

  it('should remove inline code', () => {
    const text = 'Use `inline code` here'
    expect(stripMarkdownCodeBlocks(text)).toBe('Use  here')
  })

  it('should handle multiple code blocks', () => {
    const text = '```js\ncode1\n```\ntext\n```ts\ncode2\n```'
    expect(stripMarkdownCodeBlocks(text)).toBe('\ntext\n')
  })

  it('should preserve text without code blocks', () => {
    const text = 'Just regular text here'
    expect(stripMarkdownCodeBlocks(text)).toBe('Just regular text here')
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

describe('tablesToSQL', () => {
  it('should return warning message for empty array', () => {
    const result = tablesToSQL([])

    expect(result).toContain('-- WARNING: This schema is for context only')
  })

  it('should return empty string for non-array input', () => {
    const result = tablesToSQL(null as any)

    expect(result).toBe('')
  })

  it('should generate SQL for a simple table', () => {
    const mockTables = [
      {
        name: 'users',
        schema: 'public',
        columns: [
          {
            name: 'id',
            data_type: 'integer',
            is_nullable: false,
            is_identity: true,
            default_value: null,
            is_unique: false,
            check: null,
          },
          {
            name: 'name',
            data_type: 'text',
            is_nullable: false,
            is_identity: false,
            default_value: null,
            is_unique: false,
            check: null,
          },
        ],
        primary_keys: [{ name: 'id' }],
        relationships: [],
      },
    ] as any

    const result = tablesToSQL(mockTables)

    expect(result).toContain('-- WARNING: This schema is for context only')
    expect(result).toContain('CREATE TABLE public.users (')
    expect(result).toContain('id integer GENERATED ALWAYS AS IDENTITY NOT NULL')
    expect(result).toContain('name text NOT NULL')
    expect(result).toContain('CONSTRAINT users_pkey PRIMARY KEY (id)')
  })

  it('should handle tables with various column properties', () => {
    const mockTables = [
      {
        name: 'products',
        schema: 'public',
        columns: [
          {
            name: 'id',
            data_type: 'uuid',
            is_nullable: false,
            is_identity: false,
            default_value: 'gen_random_uuid()',
            is_unique: true,
            check: null,
          },
          {
            name: 'price',
            data_type: 'numeric',
            is_nullable: true,
            is_identity: false,
            default_value: '0.00',
            is_unique: false,
            check: 'price >= 0',
          },
        ],
        primary_keys: [],
        relationships: [],
      },
    ] as any

    const result = tablesToSQL(mockTables)

    expect(result).toContain('id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE')
    expect(result).toContain('price numeric DEFAULT 0.00 CHECK (price >= 0)')
  })

  it('should handle foreign key relationships', () => {
    const mockTables = [
      {
        name: 'orders',
        schema: 'public',
        columns: [
          {
            name: 'user_id',
            data_type: 'integer',
            is_nullable: false,
            is_identity: false,
            default_value: null,
            is_unique: false,
            check: null,
          },
        ],
        primary_keys: [],
        relationships: [
          {
            constraint_name: 'fk_orders_user_id',
            source_table_name: 'orders',
            source_column_name: 'user_id',
            target_table_schema: 'public',
            target_table_name: 'users',
            target_column_name: 'id',
          },
        ],
      },
    ] as any

    const result = tablesToSQL(mockTables)

    expect(result).toContain(
      'CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES public.users(id)'
    )
  })

  it('should handle tables with no columns', () => {
    const mockTables = [
      {
        name: 'empty_table',
        schema: 'public',
        columns: null,
        primary_keys: [],
        relationships: [],
      },
    ] as any

    const result = tablesToSQL(mockTables)

    expect(result).toContain('-- WARNING: This schema is for context only')
    expect(result).not.toContain('CREATE TABLE')
  })
})
