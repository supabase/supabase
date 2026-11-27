export const DOCS_FEEDBACK_URL = 'https://supabase.com/docs/guides/ai-tools/agent-feedback.md'

export const LLMS_TXT_URL = 'https://supabase.com/docs/llms.txt'

// only guides have markdown at the same URL; reference .md requests 404
export const LLMS_TXT_DIRECTIVE_HTML = `For AI agents: the documentation index is at <a href="${LLMS_TXT_URL}" tabindex="-1">llms.txt</a>. Guide pages have a markdown version at the same path with .md appended, before any query string or fragment.`

export const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=supabase.com'

export function askAiPrompt(pageUrl: string) {
  return `Read from ${pageUrl} so I can ask questions about its contents`
}

export function askAiUrls(pageUrl: string) {
  const prompt = encodeURIComponent(askAiPrompt(pageUrl))
  return {
    chatgpt: `https://chatgpt.com/?hint=search&q=${prompt}`,
    claude: `https://claude.ai/new?q=${prompt}`,
  }
}
