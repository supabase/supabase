import { cn } from 'ui'
import { AiTools } from 'ui-patterns/AiTools'
import { AnchorProvider, TocSection } from 'ui-patterns/Toc'
import type { TOCItemType } from 'ui-patterns/Toc/types'

export interface GuideSidebarProps {
  items: TOCItemType[]
  pageUrl: string
  markdownUrl: string
  className?: string
}

const getArticleHtml = () => document.querySelector('article')?.innerHTML ?? ''

export const GuideSidebar = ({ items, pageUrl, markdownUrl, className }: GuideSidebarProps) => (
  <AnchorProvider toc={items} single={false}>
    <div className={cn('flex flex-col gap-8 border-l px-2', className)}>
      <AiTools
        pageUrl={pageUrl}
        markdownUrl={markdownUrl}
        markdownFallback={getArticleHtml}
        agentSetupHref="https://supabase.com/docs/guides/ai-tools"
        className="pl-5"
      />
      {items.length > 0 ? <TocSection items={items} /> : null}
    </div>
  </AnchorProvider>
)
