'use client'

import { useEffect, useState } from 'react'
import { cn } from 'ui'

function slugify(text: string) {
  let slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-')
    .replace(/-{2,}/g, '-')
    .trim()
  if (/^\d/.test(slug)) slug = `section-${slug}`
  return slug
}

interface Heading {
  text: string
  slug: string
  level: number
}

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = []
  // Trim each line first to handle indented markdown, then match ATX headings.
  // Using a literal space (not \s+) after the hashes avoids polynomial backtracking.
  const regex = /^(#{1,3}) (.+)$/gm
  const normalized = markdown
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n')
  let match
  while ((match = regex.exec(normalized)) !== null) {
    const text = match[2].trim()
    headings.push({
      text,
      slug: slugify(text),
      level: match[1].length,
    })
  }
  return headings
}

export default function TableOfContents({ content }: { content: string }) {
  const headings = extractHeadings(content)
  const [activeSlug, setActiveSlug] = useState<string>('')

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24">
      <ul className="flex flex-col gap-2 border-l border-muted border-dashed">
        {headings.map((heading) => (
          <li key={heading.slug}>
            <a
              href={`#${heading.slug}`}
              className={cn(
                'block text-xs -ml-px border-l transition-colors',
                heading.level === 1 && 'pl-4',
                heading.level === 2 && 'pl-4',
                heading.level === 3 && 'pl-8',
                activeSlug === heading.slug
                  ? 'text-foreground border-foreground'
                  : 'text-foreground-muted border-transparent hover:text-foreground-lighter'
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { slugify }
