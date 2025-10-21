import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import {
  convertRichTextToMarkdownWithBlocks,
  convertRichTextToMarkdown,
} from './convertRichTextToMarkdown'
import { generateTocFromMarkdown } from '~/lib/toc'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
// Define minimal block structure for compatibility
type CMSBlock = {
  blockType: string
  [key: string]: any
}

export interface ProcessedCMSContent {
  content: MDXRemoteSerializeResult
  blocks: CMSBlock[]
  toc: { content: string; json: any[] }
  plainMarkdown: string
}

/**
 * Process PayloadCMS content for use in the www blog
 * This function handles:
 * 1. Raw markdown strings (new textarea field)
 * 2. Lexical rich text JSON (legacy format)
 * 3. Custom blocks converted to existing www syntax
 */
export async function processCMSContent(
  content: any,
  tocDepth: number = 3
): Promise<ProcessedCMSContent> {
  try {
    // Check if content is already a markdown string
    if (typeof content === 'string') {
      // Direct markdown string - no conversion needed
      const toc = await generateTocFromMarkdown(content, tocDepth)
      const mdxContent = await mdxSerialize(content, { tocDepth })

      return {
        content: mdxContent,
        blocks: [],
        toc,
        plainMarkdown: content,
      }
    }

    // Handle Lexical JSON format (legacy)
    if (content?.root?.children) {
      // Convert rich text to markdown with blocks converted to existing www syntax
      const { markdown, blocks } = convertRichTextToMarkdownWithBlocks(content)

      // Generate TOC from the converted markdown
      const toc = await generateTocFromMarkdown(markdown, tocDepth)

      // Serialize the markdown for MDX (blocks are now converted to existing components)
      const mdxContent = await mdxSerialize(markdown, { tocDepth })

      return {
        content: mdxContent,
        blocks,
        toc,
        plainMarkdown: markdown,
      }
    }

    // Fallback for unexpected format
    throw new Error('Content format not recognized')
  } catch (error) {
    console.error('Error processing CMS content:', error)

    // Last resort fallback
    const fallbackMarkdown =
      typeof content === 'string' ? content : convertRichTextToMarkdown(content)
    const toc = await generateTocFromMarkdown(fallbackMarkdown, tocDepth)
    const mdxContent = await mdxSerialize(fallbackMarkdown, { tocDepth })

    return {
      content: mdxContent,
      blocks: [],
      toc,
      plainMarkdown: fallbackMarkdown,
    }
  }
}

/**
 * Legacy function for processing content without blocks (for backward compatibility)
 */
export async function processCMSContentLegacy(
  richTextContent: any,
  tocDepth: number = 3
): Promise<{
  content: MDXRemoteSerializeResult
  toc: { content: string; json: any[] }
  plainMarkdown: string
}> {
  const plainMarkdown = convertRichTextToMarkdown(richTextContent)
  const toc = await generateTocFromMarkdown(plainMarkdown, tocDepth)
  const mdxContent = await mdxSerialize(plainMarkdown, { tocDepth })

  return {
    content: mdxContent,
    toc,
    plainMarkdown,
  }
}
