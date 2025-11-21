import { CMS_SITE_ORIGIN } from '../constants'

// Define minimal block structure for compatibility
type CMSBlock = {
  blockType: string
  [key: string]: any
}

/**
 * Enhanced convert function that handles both text nodes and custom blocks
 * Converts CMS blocks into existing www markdown syntax
 */
export function convertRichTextToMarkdownWithBlocks(content: any): {
  markdown: string
  blocks: CMSBlock[]
} {
  if (!content?.root?.children) return { markdown: '', blocks: [] }

  const blocks: CMSBlock[] = []

  const markdown = content.root.children
    .map((node: any) => {
      // Handle basic text nodes
      if (node.type === 'heading') {
        const level = node.tag && typeof node.tag === 'string' ? node.tag.replace('h', '') : '1'
        const text = node.children?.map((child: any) => child.text).join('') || ''
        return `${'#'.repeat(Number(level))} ${text}`
      }

      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text).join('') || ''
      }

      if (node.type === 'list') {
        const items = node.children
          ?.map((item: any) => {
            if (item.type === 'list-item') {
              return `- ${item.children?.map((child: any) => child.text).join('') || ''}`
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
        return items
      }

      if (node.type === 'link') {
        const text = node.children?.map((child: any) => child.text).join('') || ''
        const url = node.url || ''
        return `[${text}](${url})`
      }

      // Handle custom blocks - convert to existing www markdown syntax
      if (node.type === 'block') {
        const blockType = node.fields?.blockType

        switch (blockType) {
          case 'banner': {
            // Convert banner to Admonition
            const style = node.fields.style || 'info'
            const content = extractTextFromField(node.fields.content)
            const typeMap = {
              info: 'note',
              warning: 'warning',
              error: 'destructive',
              success: 'note',
            } as const
            return `<Admonition type="${typeMap[style as keyof typeof typeMap] || 'note'}">\n\n${content}\n\n</Admonition>`
          }

          case 'mediaBlock': {
            // Convert mediaBlock to Img component
            const media = node.fields.media
            if (typeof media === 'object' && media.url) {
              const imageUrl = `${CMS_SITE_ORIGIN}${media.url}` // Coming from the CMS app
              const alt = extractTextFromField(media.alt)
              const caption = extractTextFromField(media.caption)

              let imgComponent = ''

              if (caption) {
                imgComponent = `<Img alt="${alt}" src="${imageUrl}" caption="${caption}" />`
              } else {
                imgComponent = `<Img alt="${alt}" src="${imageUrl}" />`
              }

              return imgComponent
            }
            return ''
          }

          case 'code': {
            // Convert code block to markdown code block
            const language = node.fields.language || 'text'
            const code = node.fields.code || ''
            return `\`\`\`${language}\n${code}\n\`\`\``
          }

          case 'quote': {
            // Convert quote to Quote component
            const text = extractTextFromField(node.fields.text)
            const caption = extractTextFromField(node.fields.caption)

            const img = node.fields.img

            let imgProp = ''
            if (typeof img === 'object' && img?.url) {
              const imageUrl = `${CMS_SITE_ORIGIN}${img.url}`

              imgProp = ` img="${imageUrl}"`
            }

            const captionProp = caption ? ` caption="${caption}"` : ''

            return `<Quote${imgProp}${captionProp}>\n${text}\n</Quote>`
          }

          case 'youtube': {
            // Convert YouTube to video-container div with iframe
            const youtubeId = node.fields.youtubeId || ''
            return `<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/${youtubeId}"
    title="YouTube video player"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>`
          }

          default:
            console.warn('Unknown block type:', blockType)
            return ''
        }
      }

      return ''
    })
    .filter(Boolean)
    .join('\n\n')

  return { markdown, blocks }
}

/**
 * Helper function to extract text from either a string or rich text object
 */
function extractTextFromField(field: any): string {
  if (!field) return ''

  if (typeof field === 'string') {
    return field
  }

  if (typeof field === 'object') {
    return convertSimpleRichTextToPlainText(field)
  }

  return ''
}

/**
 * Convert simple rich text content to plain text (for banner content)
 */
function convertSimpleRichTextToPlainText(content: any): string {
  if (!content?.root?.children) return ''

  return content.root.children
    .map((node: any) => {
      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text).join('') || ''
      }

      if (node.type === 'heading') {
        const text = node.children?.map((child: any) => child.text).join('') || ''
        return text
      }

      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Convert simple rich text content (like banner content) to HTML
 */
function convertSimpleRichTextToHTML(content: any): string {
  if (!content?.root?.children) return ''

  return content.root.children
    .map((node: any) => {
      if (node.type === 'paragraph') {
        const text =
          node.children
            ?.map((child: any) => {
              if (child.bold) return `<strong>${child.text}</strong>`
              if (child.italic) return `<em>${child.text}</em>`
              if (child.code) return `<code>${child.text}</code>`
              return child.text
            })
            .join('') || ''
        return `<p>${text}</p>`
      }

      if (node.type === 'heading') {
        const level = node.tag && typeof node.tag === 'string' ? node.tag.replace('h', '') : '2'
        const text = node.children?.map((child: any) => child.text).join('') || ''
        return `<h${level}>${text}</h${level}>`
      }

      return ''
    })
    .filter(Boolean)
    .join('')
}

/**
 * Legacy function for backward compatibility - converts to plain markdown without blocks
 */
export function convertRichTextToMarkdown(content: any): string {
  if (!content?.root?.children) return ''

  return content.root.children
    .map((node: any) => {
      if (node.type === 'heading') {
        const level = node.tag && typeof node.tag === 'string' ? node.tag.replace('h', '') : '1'
        const text = node.children?.map((child: any) => child.text).join('') || ''
        return `${'#'.repeat(Number(level))} ${text}`
      }
      if (node.type === 'paragraph') {
        return node.children?.map((child: any) => child.text).join('') || ''
      }
      if (node.type === 'list') {
        const items = node.children
          ?.map((item: any) => {
            if (item.type === 'list-item') {
              return `- ${item.children?.map((child: any) => child.text).join('') || ''}`
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
        return items
      }
      if (node.type === 'link') {
        const text = node.children?.map((child: any) => child.text).join('') || ''
        const url = node.url || ''
        return `[${text}](${url})`
      }

      // For blocks, just return placeholder text for TOC generation
      if (node.type === 'block') {
        const blockType = node.fields?.blockType
        switch (blockType) {
          case 'code':
            return `\`\`\`${node.fields.language || ''}\n${node.fields.code || ''}\n\`\`\``
          case 'quote':
            return `> ${node.fields.text || ''}`
          default:
            return ''
        }
      }

      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}
