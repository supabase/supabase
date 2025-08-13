import { notFound } from 'next/navigation'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import {
  generateAiPromptMetadata,
  generateAiPromptsStaticParams,
  getAiPrompt,
} from './AiPrompts.utils'

export const dynamicParams = false

export default async function AiPromptsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params

  const { slug } = params

  const prompt = await getAiPrompt(slug)
  if (!prompt) {
    notFound()
  }

  let { heading, content } = prompt
  content = `
## How to use

Copy the prompt to a file in your repo.

Use the "include file" feature from your AI tool to include the prompt when chatting with your AI assistant. For example, with GitHub Copilot, use \`#<filename>\`, in Cursor, use \`@Files\`, and in Zed, use \`/file\`.

## Prompt

${content}
`.trim()

  return (
    <GuideTemplate
      meta={{ title: `AI Prompt: ${heading}` }}
      content={content}
      editLink={newEditLink(`supabase/supabase/blob/master/examples/prompts/${slug}.md`)}
    />
  )
}

export const generateMetadata = generateAiPromptMetadata
export const generateStaticParams = generateAiPromptsStaticParams
