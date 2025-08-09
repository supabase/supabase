import { type ReactNode } from 'react'
import { cn } from 'ui'

import Breadcrumbs from '~/components/Breadcrumbs'

interface GuideArticleProps {
  children: ReactNode
  className?: string
}

export function GuideArticle({ children, className }: GuideArticleProps) {
  return (
    <>
      <Breadcrumbs className="mb-2" />
      <article
        // Used to get headings for the table of contents
        id="sb-docs-guide-main-article"
        className={cn('prose max-w-none', className)}
      >
        {children}
      </article>
    </>
  )
}
