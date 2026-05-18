import { useParams } from 'common'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui'

interface MarketplaceDetailTopBarProps {
  title: string
  actions?: ReactNode
  isInstalled?: boolean
}

export const MarketplaceDetailTopBar = ({
  title,
  isInstalled,
  actions,
}: MarketplaceDetailTopBarProps) => {
  const { ref } = useParams()

  return (
    <div className="sticky min-h-(--header-height) top-0 z-20 flex justify-between items-center border-b bg-dash-sidebar px-6 py-2.5 xl:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-4 [&_li]:text-xs">
        <BreadcrumbList className="min-w-0 flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/project/${ref}/integrations`}>Integrations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="block min-w-0 truncate">{title}</BreadcrumbPage>
            {isInstalled && <Badge variant="success">Installed</Badge>}
          </BreadcrumbItem>
        </BreadcrumbList>
      </div>

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  )
}
