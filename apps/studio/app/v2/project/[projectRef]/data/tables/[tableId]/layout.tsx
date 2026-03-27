'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { InsightBar } from '@/components/v2/InsightBar'
import { StudioDataWorkspace } from '@/components/v2/data/StudioDataWorkspace'

const SUB_TABS = [
  { slug: 'data', label: 'Data' },
  { slug: 'schema', label: 'Schema' },
  { slug: 'policies', label: 'Policies' },
  { slug: 'indexes', label: 'Indexes' },
  { slug: 'settings', label: 'Settings' },
]

export default function TableDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const { projectRef } = useV2Params()
  const tableId = params?.tableId as string

  const base = projectRef ? `/v2/project/${projectRef}/data/tables/${tableId}` : ''

  return (
    <StudioDataWorkspace projectRef={projectRef} id={tableId}>
      <div className="flex flex-col h-full">
        <InsightBar objectType="table" objectId={tableId} objectName={tableId} />
        <div className="flex items-center border-b border-border shrink-0 min-h-[36px]">
          {SUB_TABS.map((tab) => {
            const href = `${base}/${tab.slug}`
            const isActive = pathname === href || pathname?.startsWith(href + '/')
            return (
              <Link
                key={tab.slug}
                href={href}
                className={cn(
                  'relative px-3 py-2.5 text-xs transition-colors',
                  'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t',
                  isActive
                    ? 'text-foreground font-medium after:bg-foreground'
                    : 'text-foreground-lighter hover:text-foreground after:bg-transparent'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
        {/* Let TableGridEditor / SupabaseGrid own vertical scrolling; overflow-auto here collapses flex height */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </StudioDataWorkspace>
  )
}
