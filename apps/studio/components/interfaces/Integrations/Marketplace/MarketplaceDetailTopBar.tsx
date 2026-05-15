import { useParams } from 'common'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface MarketplaceDetailTopBarProps {
  title: string
  actions?: ReactNode
}

export const MarketplaceDetailTopBar = ({ title, actions }: MarketplaceDetailTopBarProps) => {
  const { ref } = useParams()

  return (
    <div className="sticky h-(--header-height) top-0 z-20 flex shrink-0 items-center border-b bg-dash-sidebar px-6 py-2.5 xl:px-10">
      <div className="flex items-center gap-2 text-xs justify-between">
        <Link
          href={`/project/${ref}/integrations`}
          className="inline-flex items-center gap-1 text-foreground-light hover:text-foreground"
        >
          <ChevronLeft size={13} />
          Integrations
        </Link>
        <span className="text-foreground-muted">/</span>
        <div>{title}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </div>
  )
}
