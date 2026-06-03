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
import { ShimmeringLoader } from 'ui-patterns'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'

interface MarketplaceDetailBreadrumbsProps {
  isLoading?: boolean
  title?: string
  actions?: ReactNode
  isInstalled?: boolean
}

export const MarketplaceDetailBreadrumbs = ({
  isLoading,
  title,
  isInstalled,
  actions,
}: MarketplaceDetailBreadrumbsProps) => {
  const { ref } = useParams()

  return (
    <PageBreadcrumbs
      slotClassName="sticky top-0 z-20 bg-dash-sidebar"
      className="max-h-(--header-height)! flex justify-between items-center w-full md:px-2 xl:px-6"
      actions={
        <PageBreadcrumbsActions>
          {isLoading ? <ShimmeringLoader className="w-24" /> : actions}
        </PageBreadcrumbsActions>
      }
    >
      <BreadcrumbList className="flex-1 min-w-0 flex-nowrap [&_li]:text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/project/${ref}/integrations`}>Integrations</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="block min-w-0 truncate">
            {isLoading ? <ShimmeringLoader className="w-24" /> : title}
          </BreadcrumbPage>
          {isInstalled && <Badge variant="success">Installed</Badge>}
        </BreadcrumbItem>
      </BreadcrumbList>
    </PageBreadcrumbs>
  )
}
