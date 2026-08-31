import type { PostHogConfig } from 'posthog-js'

export type EmbeddedAgentBrowser = 'claude_desktop' | 'chatgpt_desktop'

const CLAUDE_DESKTOP_UA = /(^| )Claude\/\d/
const CHATGPT_DESKTOP_UA = /(^| )ChatGPT\/\d/

// Newer Claude Desktop builds omit the Electron/ token, so Claude matches on its product
// token alone. ChatGPT's token also appears in mobile in-app WebViews, so it stays Electron-gated.
export function detectEmbeddedAgentBrowser(userAgent: string): EmbeddedAgentBrowser | undefined {
  if (CLAUDE_DESKTOP_UA.test(userAgent)) return 'claude_desktop'
  if (CHATGPT_DESKTOP_UA.test(userAgent) && userAgent.includes('Electron/')) {
    return 'chatgpt_desktop'
  }
  return undefined
}

export function buildEmbeddedAgentBrowserConfig(
  userAgent: string | undefined
): Partial<PostHogConfig> {
  const embeddedAgentBrowser = userAgent ? detectEmbeddedAgentBrowser(userAgent) : undefined
  if (!embeddedAgentBrowser) return {}

  return {
    before_send: (captureResult) => {
      if (!captureResult) return captureResult
      captureResult.properties = {
        ...captureResult.properties,
        embedded_agent_browser: embeddedAgentBrowser,
      }
      return captureResult
    },
  }
}
