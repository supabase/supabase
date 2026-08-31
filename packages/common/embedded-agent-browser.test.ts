import { describe, expect, it } from 'vitest'

import { detectEmbeddedAgentBrowser } from './embedded-agent-browser'

describe('detectEmbeddedAgentBrowser', () => {
  it('detects Claude Desktop on Mac with Electron token', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36'
      )
    ).toBe('claude_desktop')
  })

  it('detects Claude Desktop on Windows MSIX with Electron token', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.34493.1 Chrome/148.0.7778.280 Electron/42.9.2 Safari/537.36 MSIX'
      )
    ).toBe('claude_desktop')
  })

  it('detects Claude Desktop on Mac without Electron token', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.40609.0 Chrome/148.0.7778.280 Safari/537.36'
      )
    ).toBe('claude_desktop')
  })

  it('detects Claude Desktop on Windows MSIX without Electron token', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.37937.3 Chrome/148.0.7778.280 Safari/537.36 MSIX'
      )
    ).toBe('claude_desktop')
  })

  it('detects Claude Desktop when the token starts the UA string', () => {
    expect(detectEmbeddedAgentBrowser('Claude/1.2.3 Chrome/148.0.0.0')).toBe('claude_desktop')
  })

  it('detects ChatGPT Desktop with Electron token', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'ChatGPT/1.2026.190 (Windows_NT 10.0.26200; x86_64; build ) Electron/39.2.7 Chrome/142.0.7444.235'
      )
    ).toBe('chatgpt_desktop')
  })

  it('does not tag ChatGPT Android in-app WebView (no Electron token)', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Linux; Android 16; 25100RA69G Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.153 Mobile Safari/537.36 ChatGPT/1.2026.230 (Android 16; 25100RA69G)'
      )
    ).toBeUndefined()
  })

  it('does not tag stock desktop Chrome', () => {
    expect(
      detectEmbeddedAgentBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
      )
    ).toBeUndefined()
  })

  it('does not tag a token without a leading boundary', () => {
    expect(detectEmbeddedAgentBrowser('Mozilla/5.0 NotClaude/1.0')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(detectEmbeddedAgentBrowser('')).toBeUndefined()
  })
})
