import { describe, expect, it } from 'vitest'

import { PromptPanel } from './PromptPanel'

function serializePrompt({
  title,
  copyValue,
  content,
}: {
  title: string
  copyValue: string
  content: string
}) {
  const children = [
    PromptPanel.PromptTitle({ children: title }),
    PromptPanel.PromptCopy({ children: copyValue }),
    PromptPanel.PromptContent({ children: content }),
  ]
    .filter(Boolean)
    .join('\n\n')

  return PromptPanel.Prompt({ children })
}

describe('PromptPanel markdown schema', () => {
  it('flattens prompts in order while preserving visible rich content', () => {
    const prompt = serializePrompt({
      title: 'AI Prompt',
      copyValue: 'clipboard-only prompt payload',
      content:
        'Install the CLI with `npm install -g supabase` and read the [CLI guide](/docs/guides/local-development/cli/getting-started).',
    })
    const cli = serializePrompt({
      title: 'CLI',
      copyValue: 'clipboard-only CLI payload',
      content: '```bash\nsupabase init\n```',
    })

    const markdown = PromptPanel.PromptPanel({ children: [prompt, cli].join('\n\n') })

    expect(markdown).toBe(`**AI Prompt**

Install the CLI with \`npm install -g supabase\` and read the [CLI guide](/docs/guides/local-development/cli/getting-started).

**CLI**

\`\`\`bash
supabase init
\`\`\``)
    expect(markdown).not.toContain('clipboard-only')
  })

  it('omits empty titles without dropping prompt content', () => {
    const markdown = serializePrompt({
      title: '  ',
      copyValue: 'clipboard-only content',
      content: 'Visible content',
    })

    expect(markdown).toBe('Visible content')
  })

  it('registers every PromptPanel marker component', () => {
    expect(Object.keys(PromptPanel)).toEqual([
      'PromptPanel',
      'Prompt',
      'PromptTitle',
      'PromptCopy',
      'PromptContent',
    ])
  })
})
