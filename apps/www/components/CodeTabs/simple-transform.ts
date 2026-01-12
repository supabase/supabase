/**
 * Simple string-based transformation for CodeTabs
 * This avoids the complex AST manipulation that's causing issues
 */

export function transformCodeTabs(mdx: string): string {
  // Pattern to match <$CodeTabs>...</$CodeTabs> blocks
  const codeTabsPattern = /<\$CodeTabs>([\s\S]*?)<\/\$CodeTabs>/g

  return mdx.replace(codeTabsPattern, (match, content) => {
    // Extract code blocks from the content
    const codeBlockPattern = /```(\w+)(?:\s+name=([^\s]+))?\s*\n([\s\S]*?)\n```/g
    const codeBlocks: Array<{ lang: string; name?: string; content: string }> = []

    let blockMatch: RegExpExecArray | null
    // biome-ignore lint/suspicious/noAssignInExpressions: required for regex loop
    while ((blockMatch = codeBlockPattern.exec(content)) !== null) {
      const [, lang, name, blockContent] = blockMatch
      codeBlocks.push({
        lang,
        name: name || `${lang}.${lang === 'bash' ? 'sh' : lang}`,
        content: blockContent.trim(),
      })
    }

    if (codeBlocks.length === 0) {
      return match // Return original if no code blocks found
    }

    // Generate the Tabs structure
    const tabPanels = codeBlocks
      .map(
        (block) => `
  <TabPanel id="${block.name}" label="${block.name}">

\`\`\`${block.lang}
${block.content}
\`\`\`

  </TabPanel>`
      )
      .join('')

    return `
<Tabs listClassNames="flex-nowrap overflow-x-auto -mb-6">${tabPanels}
</Tabs>`
  })
}
