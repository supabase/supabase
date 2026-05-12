import { useParams } from 'common'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface MarketplaceDetailTopBarProps {
  /** Integration name to render as the title in the bar */
  title: string
  /** Right-aligned actions (e.g. Docs, Install, Manage) */
  actions?: ReactNode
}

/**
 * Anchored top action bar above the brand hero on the integration detail
 * page. Kept as its own component so it can stay sticky/anchored across tabs
 * and be reused by future marketplace surfaces.
 */
export const MarketplaceDetailTopBar = ({ title, actions }: MarketplaceDetailTopBarProps) => {
  const { ref } = useParams()

  return (
    <div className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b bg-dash-sidebar px-6 py-2.5 xl:px-10">
      <Link
        href={`/project/${ref}/integrations`}
        className="inline-flex items-center gap-1 text-xs text-foreground-light hover:text-foreground"
      >
        <ChevronLeft size={13} />
        Integrations
      </Link>
      <div className="text-[13.5px] font-medium">{title}</div>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </div>
  )
}
