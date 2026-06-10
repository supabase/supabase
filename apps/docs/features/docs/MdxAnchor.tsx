import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { type ComponentPropsWithoutRef } from 'react'
import { cn } from 'ui'

const isExternalHref = (href?: string) => {
  if (!href || !/^https?:\/\//i.test(href)) return false
  try {
    return !/(^|\.)supabase\.com$/i.test(new URL(href).hostname)
  } catch {
    return false
  }
}

// Walk the tree and concatenate text so the aria-label matches the visible link
const flattenChildrenToText = (node: unknown): string => {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenChildrenToText).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props
    return flattenChildrenToText(props?.children)
  }
  return ''
}

export function MdxAnchor({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  if (!isExternalHref(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  const label = flattenChildrenToText(children).trim()
  return (
    <a href={href} aria-label={label ? `External Source: ${label}` : undefined} {...rest}>
      {children}
      <ExternalLinkIcon
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
        className="inline-block align-[-1px] ml-0.5 text-lighter"
      />
    </a>
  )
}
