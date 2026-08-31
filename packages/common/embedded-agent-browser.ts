export type EmbeddedAgentBrowser = 'claude_desktop' | 'chatgpt_desktop'

const CLAUDE_DESKTOP_UA = /(^| )Claude\/\d/
const CHATGPT_DESKTOP_UA = /(^| )ChatGPT\/\d/

// Claude Desktop >= ~1.37937 drops the Electron/ UA token on every platform, so Claude
// matches on its product token alone. ChatGPT's token also appears in mobile in-app
// WebView UAs (human browsing), so it stays gated on the Electron/ token.
export function detectEmbeddedAgentBrowser(userAgent: string): EmbeddedAgentBrowser | undefined {
  if (CLAUDE_DESKTOP_UA.test(userAgent)) return 'claude_desktop'
  if (CHATGPT_DESKTOP_UA.test(userAgent) && userAgent.includes('Electron/')) {
    return 'chatgpt_desktop'
  }
  return undefined
}
