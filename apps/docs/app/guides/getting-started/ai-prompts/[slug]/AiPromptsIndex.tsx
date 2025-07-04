import Link from 'next/link'

import { GlassPanel } from 'ui-patterns'

import { getAiPrompts } from './AiPrompts.utils'

export async function AiPromptsIndex() {
  const prompts = await getAiPrompts()

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 not-prose">
      {prompts.map((prompt) => (
        <Link
          key={prompt.filename}
          href={`/guides/getting-started/ai-prompts/${prompt.filename}`}
          passHref
        >
          <GlassPanel
            key={prompt.filename}
            title={prompt.heading ?? prompt.filename.replaceAll('-', ' ')}
          />
        </Link>
      ))}
    </div>
  )
}
