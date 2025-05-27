'use client'

import { MDXRemote } from 'next-mdx-remote'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { useEffect, useState } from 'react'

interface BlogMarkdownProcessorProps {
  content: string
  mdxSource: any
  toc_depth?: number
  className?: string
}

interface TocEntry {
  depth: number
  text: string
  id: string
}

function generateToc(content: string, maxDepth: number = 2): string {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TocEntry[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length
    if (depth <= maxDepth) {
      const text = match[2].trim()
      // Generate GitHub-style ID (lowercase, replace spaces with hyphens)
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      toc.push({ depth, text, id })
    }
  }

  // Convert TOC entries to markdown
  return toc
    .map((entry) => {
      const indent = '  '.repeat(entry.depth - 1)
      return `${indent}- [${entry.text}](#${entry.id})`
    })
    .join('\n')
}

export function BlogMarkdownProcessor({
  content,
  mdxSource,
  toc_depth,
  className,
}: BlogMarkdownProcessorProps) {
  const [tocContent, setTocContent] = useState<string>('')

  useEffect(() => {
    if (content) {
      const tocMarkdown = generateToc(content, toc_depth || 2)
      setTocContent(tocMarkdown)
    }
  }, [content, toc_depth])

  return (
    <div className={className}>
      <MDXRemote {...mdxSource} components={mdxComponents('blog')} />
      {tocContent && (
        <div className="hidden lg:block py-8">
          <div>
            <p className="text-foreground mb-4">On this page</p>
            <div className="prose-toc">
              <ReactMarkdown>{tocContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
