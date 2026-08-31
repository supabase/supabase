import type { PostHogConfig } from 'posthog-js'

export type EmbeddedAgentBrowser = 'claude_desktop' | 'chatgpt_desktop'

const CLAUDE_UA = /(^| )Claude\/\d/
const CHATGPT_UA = /(^| )ChatGPT\/\d/
const MOBILE_UA = /Mobile|Android|iPhone|iPad/

// Agent product tokens also appear in mobile in-app WebView UAs, which are human browsing,
// so mobile UAs are excluded. Vendor Electron/ tokens come and go across releases, so
// desktop detection never gates on them.
export function detectEmbeddedAgentBrowser(userAgent: string): EmbeddedAgentBrowser | undefined {
  if (MOBILE_UA.test(userAgent)) return undefined
  if (CLAUDE_UA.test(userAgent)) return 'claude_desktop'
  if (CHATGPT_UA.test(userAgent)) return 'chatgpt_desktop'
  return undefined
}

export function buildEmbeddedAgentBrowserConfig(userAgent: string): Partial<PostHogConfig> {
  const embeddedAgentBrowser = detectEmbeddedAgentBrowser(userAgent)
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
