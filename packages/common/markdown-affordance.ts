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
