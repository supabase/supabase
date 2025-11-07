import { source } from 'common-tags'
import { notFound } from 'next/navigation'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import {
  generateAiPromptMetadata,
  generateAiPromptsStaticParams,
  generateCursorPromptDeepLink,
  getAiPrompt,
  wrapInMarkdownCodeBlock,
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
  const { url: cursorUrl } = generateCursorPromptDeepLink(content)

  content = source`
    ## How to use

    Copy the prompt to a file in your repo.

    Use the "include file" feature from your AI tool to include the prompt when chatting with your AI assistant. For example, with GitHub Copilot, use \`#<filename>\`, in Cursor, use \`@Files\`, and in Zed, use \`/file\`.

    ${
      cursorUrl
        ? source`
            You can also load the prompt directly into your IDE via the following links:
              - [Open in Cursor](${cursorUrl})
          `
        : ''
    }

    ## Prompt

    ${wrapInMarkdownCodeBlock(content)}
  `

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
