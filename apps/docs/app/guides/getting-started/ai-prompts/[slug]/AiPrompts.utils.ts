import matter from 'gray-matter'
import type { Code, Heading, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { cache } from 'react'
import { visit, EXIT } from 'unist-util-visit'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

import { EXAMPLES_DIRECTORY } from '~/lib/docs'

const { metadataTitle } = getCustomContent(['metadata:title'])

const PROMPTS_DIRECTORY = join(EXAMPLES_DIRECTORY, 'prompts')

function parseMarkdown(markdown: string) {
  const { content: withoutFrontmatter } = matter(markdown)
  const mdast = fromMarkdown(withoutFrontmatter)

  let heading = ''
  visit(mdast, 'heading', (node: Heading) => {
    if (node.depth === 1) {
      if ('value' in node.children[0]) {
        heading = node.children[0].value
      }
      return EXIT
    }
  })

  return { heading, content: withoutFrontmatter.trim() }
}

/**
 * Wraps content in a markdown code block.
 *
 * Uses `mdast` to ensure proper escaping of backticks within the content.
 */
export function wrapInMarkdownCodeBlock(content: string) {
  const mdast = fromMarkdown(content)

  const codeBlock: Code = {
    type: 'code',
    lang: 'markdown',
    value: content,
  }
  const root: Root = {
    type: 'root',
    children: [codeBlock],
  }

  return toMarkdown(root)
}

async function getAiPromptsImpl() {
  const directoryContents = await readdir(PROMPTS_DIRECTORY)

  const prompts = directoryContents
    .filter(async (file) => {
      if (extname(file) !== '.md') {
        return false
      }

      const fileStats = await stat(join(PROMPTS_DIRECTORY, file))
      const isFile = fileStats.isFile()
      return isFile
    })
    .map(async (filename) => {
      const rawContent = await readFile(join(PROMPTS_DIRECTORY, filename), 'utf-8')
      const { heading, content } = parseMarkdown(rawContent)

      return {
        filename: basename(filename, '.md'),
        heading,
        content,
      }
    })

  return (await Promise.all(prompts)).sort((a, b) => b.filename.localeCompare(a.filename))
}
export const getAiPrompts = cache(getAiPromptsImpl)

async function getAiPromptImpl(prompt: string) {
  const filePath = join(PROMPTS_DIRECTORY, `${prompt}.md`)
  try {
    const rawContent = await readFile(filePath, 'utf-8')
    const { heading, content } = parseMarkdown(rawContent)
    return { heading, content }
  } catch (err) {
    console.error('Failed to fetch prompt from repo: %o', err)
  }
}
export const getAiPrompt = cache(getAiPromptImpl)

export async function generateAiPromptMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const prompt = await getAiPrompt(slug)

  if (!prompt) {
    return {
      title: `AI Prompt | ${metadataTitle || 'Supabase'}`,
    }
  }

  return {
    title: `AI Prompt: ${prompt.heading} | Supabase Docs`,
  }
}

export async function generateAiPromptsStaticParams() {
  const prompts = await getAiPrompts()

  return prompts.map((prompt) => {
    return {
      slug: prompt.filename,
    }
  })
}

/**
 * Generates a deep link URL for Cursor that preloads the given prompt text.
 *
 * Cursor deep links have a maximum URL length of 8000 characters.
 * If the generated URL exceeds this length, `url` will be undefined
 * and an error will be returned.
 */
export function generateCursorPromptDeepLink(promptText: string) {
  // Temporarily reject prompts that contain ".env" due to a bug in Cursor
  if (promptText.includes('.env')) {
    return { error: new Error('Prompt text cannot contain the text .env due to a temporary bug') }
  }

  const url = new URL('cursor://anysphere.cursor-deeplink/prompt')
  url.searchParams.set('text', promptText)
  const urlString = url.toString()

  // Cursor has a max URL length of 8000 characters for deep links
  if (urlString.length > 8000) {
    return { error: new Error('Prompt text is too long to generate a Cursor deep link.') }
  }

  return { url: urlString }
}
