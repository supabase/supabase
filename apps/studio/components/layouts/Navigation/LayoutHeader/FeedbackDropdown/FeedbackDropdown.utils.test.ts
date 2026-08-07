import { describe, expect, it } from 'vitest'

import { convertB64toBlob, isLikelySupportRequest } from './FeedbackDropdown.utils'

describe('isLikelySupportRequest', () => {
  it('returns false for empty string', () => {
    expect(isLikelySupportRequest('')).toBe(false)
  })

  it('returns false for whitespace-only input', () => {
    expect(isLikelySupportRequest('   ')).toBe(false)
  })

  it('detects "need help" pattern', () => {
    expect(isLikelySupportRequest('I need help with my database')).toBe(true)
  })

  it('detects "having trouble" pattern', () => {
    expect(isLikelySupportRequest('I am having trouble connecting')).toBe(true)
  })

  it('detects "how do I" pattern', () => {
    expect(isLikelySupportRequest('How do I reset my password?')).toBe(true)
  })

  it('detects "how to" pattern', () => {
    expect(isLikelySupportRequest('How to configure RLS policies?')).toBe(true)
  })

  it('detects "it doesn\'t work" pattern', () => {
    expect(isLikelySupportRequest("It doesn't work anymore")).toBe(true)
  })

  it('detects "isn\'t working" pattern', () => {
    expect(isLikelySupportRequest("My project isn't working")).toBe(true)
  })

  it('detects "error" keyword', () => {
    expect(isLikelySupportRequest('I get an error when deploying')).toBe(true)
  })

  it('detects "bug" keyword', () => {
    expect(isLikelySupportRequest('Found a bug in the editor')).toBe(true)
  })

  it('detects "issue" keyword', () => {
    expect(isLikelySupportRequest('There is an issue with auth')).toBe(true)
  })

  it('detects "support ticket" phrase', () => {
    expect(isLikelySupportRequest('I want to open a support ticket')).toBe(true)
  })

  it('detects "unable to" pattern', () => {
    expect(isLikelySupportRequest('I am unable to access my project')).toBe(true)
  })

  it('detects "crashed" keyword', () => {
    expect(isLikelySupportRequest('The database crashed overnight')).toBe(true)
  })

  it('detects "failed" keyword', () => {
    expect(isLikelySupportRequest('The migration failed')).toBe(true)
  })

  it('returns false for positive feedback', () => {
    expect(isLikelySupportRequest('Love this feature! Great work!')).toBe(false)
  })

  it('returns false for simple feature requests without support keywords', () => {
    expect(isLikelySupportRequest('It would be great if you added dark mode')).toBe(false)
  })

  it('returns false for generic compliments', () => {
    expect(isLikelySupportRequest('Supabase is amazing, keep it up')).toBe(false)
  })

  it('is case insensitive for detection', () => {
    expect(isLikelySupportRequest('I NEED HELP WITH MY PROJECT')).toBe(true)
    expect(isLikelySupportRequest('HOW DO I deploy?')).toBe(true)
  })

  it('detects patterns embedded in longer text', () => {
    expect(
      isLikelySupportRequest(
        'I was trying to set up my new project and having trouble with the connection string configuration.'
      )
    ).toBe(true)
  })

  it('detects "why won\'t" pattern', () => {
    expect(isLikelySupportRequest("Why won't my function deploy?")).toBe(true)
  })

  it('detects "contact support" phrase', () => {
    expect(isLikelySupportRequest('How do I contact support?')).toBe(true)
  })
})

describe('convertB64toBlob', () => {
  it('converts a valid base64 PNG data URI to a Blob with correct content type', () => {
    // A minimal 1x1 white PNG pixel in base64
    const base64Png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    const blob = convertB64toBlob(base64Png)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('produces a blob with correct byte length for known input', () => {
    // "Hello" in base64 is "SGVsbG8="
    // The prefix will be stripped, then the remaining base64 is decoded
    const base64Data = 'data:image/png;base64,SGVsbG8='
    const blob = convertB64toBlob(base64Data)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    // "Hello" is 5 bytes
    expect(blob.size).toBe(5)
  })

  it('handles larger base64 data spanning multiple 1024-byte slices', () => {
    // Create a string with enough data to span multiple slices
    // 2048 bytes of zeros in base64
    const zeros = new Uint8Array(2048)
    const binaryString = Array.from(zeros)
      .map((byte) => String.fromCharCode(byte))
      .join('')
    const base64 = btoa(binaryString)
    const dataUri = `data:image/png;base64,${base64}`
    const blob = convertB64toBlob(dataUri)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBe(2048)
  })
})
