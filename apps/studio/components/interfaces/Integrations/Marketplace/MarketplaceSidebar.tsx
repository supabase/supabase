import { useParams } from 'common'
import { ArrowUpRight, BookOpen, ChevronRight, LayoutGrid, PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, type ReactNode } from 'react'
import { cn, Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_ } from 'ui'

import {
  FEATURED_CATEGORIES,
  getCategoryIcon,
  getMarketplaceType,
  INTEGRATION_TYPES,
  type MarketplaceIntegrationType,
} from './Marketplace.constants'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DOCS_URL } from '@/lib/constants'

const sectionLabelCls =
  'px-2 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground-lighter'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

// Collapsible navigation group — title row doubles as the trigger, chevron
// rotates with the open state for affordance. Defaults to open so the sidebar
// behaves the same as before on first render.
const CollapsibleSection = ({ title, defaultOpen = true, children }: CollapsibleSectionProps) => (
  <Collapsible_Shadcn_ defaultOpen={defaultOpen}>
    <CollapsibleTrigger_Shadcn_
      className={cn(
        sectionLabelCls,
        'group flex w-full items-center justify-between gap-2 hover:text-foreground-light'
      )}
    >
      <span>{title}</span>
      <ChevronRight
        size={12}
        className="text-foreground-muted transition-transform group-data-[state=open]:rotate-90"
      />
    </CollapsibleTrigger_Shadcn_>
    <CollapsibleContent_Shadcn_ className="flex flex-col gap-y-0.5">
      {children}
    </CollapsibleContent_Shadcn_>
  </Collapsible_Shadcn_>
)

interface SidebarLinkProps {
  href: string
  active?: boolean
  icon?: React.ReactNode
  label: React.ReactNode
  count?: number | string
  className?: string
}

const SidebarLink = ({ href, active, icon, label, count, className }: SidebarLinkProps) => (
  <Link
    href={href}
    className={cn(
      'flex items-center justify-between rounded px-2 py-1 text-sm',
      'text-foreground-light hover:bg-surface-200 hover:text-foreground',
      active && 'bg-surface-200 text-foreground',
      className
    )}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span className="text-foreground-lighter">{icon}</span>
      {label}
    </span>
    {count !== undefined && (
      <span className="font-mono text-[10.5px] text-foreground-lighter">{count}</span>
    )}
  </Link>
)

const HELP_LINKS: Array<{ icon: React.ReactNode; label: string; href: string }> = [
  {
    icon: <BookOpen className="text-foreground-lighter" size={13} />,
    label: 'Integrations docs',
    href: `${DOCS_URL}/guides/integrations`,
  },
  {
    icon: <PlusSquare className="text-foreground-lighter" size={13} />,
    label: 'Build an integration',
    href: `${DOCS_URL}/guides/integrations/build-a-supabase-oauth-integration`,
  },
]

export const MarketplaceSidebar = () => {
  const router = useRouter()
  const { ref } = useParams()

  const queryString = router.asPath.split('?')[1] ?? ''
  const activeCategory = new URLSearchParams(queryString).get('category')
  const activeType = new URLSearchParams(queryString).get(
    'type'
  ) as MarketplaceIntegrationType | null

  const { data: availableIntegrations = [] } = useAvailableIntegrations()
  const { installedIntegrations } = useInstalledIntegrations()

  const typeCounts = useMemo(() => {
    const counts: Record<MarketplaceIntegrationType, number> = {
      oauth: 0,
      postgres_extension: 0,
      template: 0,
      wrapper: 0,
    }
    availableIntegrations.forEach((integration) => {
      counts[getMarketplaceType(integration)] += 1
    })
    return counts
  }, [availableIntegrations])

  const categoriesWithCounts = useMemo(
    () =>
      FEATURED_CATEGORIES.map((category) => {
        const count = availableIntegrations.filter((integration) =>
          integration.categories?.includes(category.slug)
        ).length
        return { ...category, count }
      }),
    [availableIntegrations]
  )

  const baseHref = `/project/${ref}/integrations`
  const isDiscoverActive = !activeCategory && !activeType
  const onIndexRoute = router.pathname === '/project/[ref]/integrations'
  // The detail route is /project/[ref]/integrations/[id]/[...slug?], so the
  // active integration id sits in the `id` URL param.
  const activeIntegrationId = typeof router.query.id === 'string' ? router.query.id : undefined

  return (
    <aside className="grow flex h-full w-full flex-col gap-y-0.5 overflow-y-auto p-4 text-sm">
      <SidebarLink
        href={baseHref}
        active={onIndexRoute && isDiscoverActive}
        icon={<LayoutGrid size={13} />}
        label="Explore All"
      />

      <CollapsibleSection title="Integration type">
        {INTEGRATION_TYPES.map(({ key, label, icon: Icon }) => (
          <SidebarLink
            key={key}
            href={`${baseHref}?type=${key}`}
            active={onIndexRoute && activeType === key}
            icon={<Icon size={13} />}
            label={label}
            count={typeCounts[key]}
          />
        ))}
      </CollapsibleSection>

      {categoriesWithCounts.length > 0 && (
        <CollapsibleSection title="Categories">
          {categoriesWithCounts.map((category) => {
            const Icon = getCategoryIcon(category.slug)
            return (
              <SidebarLink
                key={category.slug}
                href={`${baseHref}?category=${category.slug}`}
                active={onIndexRoute && activeCategory === category.slug}
                icon={<Icon size={13} />}
                label={category.name}
                count={category.count}
              />
            )
          })}
        </CollapsibleSection>
      )}

      {installedIntegrations.length > 0 && (
        <>
          <div className={sectionLabelCls}>Installed · {installedIntegrations.length}</div>
          {installedIntegrations.map((integration) => {
            const isActive = activeIntegrationId === integration.id
            return (
              <Link
                key={integration.id}
                href={`${baseHref}/${integration.id}/overview`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1 text-sm',
                  'text-foreground-light hover:bg-surface-200 hover:text-foreground',
                  isActive && 'bg-surface-200 text-foreground'
                )}
              >
                <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border bg-white">
                  {integration.icon({ className: 'p-0.5' })}
                </span>
                <span className="truncate">{integration.name}</span>
              </Link>
            )
          })}
        </>
      )}

      <div className={sectionLabelCls}>Resources</div>
      {HELP_LINKS.map(({ icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded px-2 py-1 text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          <ArrowUpRight size={11} className="opacity-50" />
        </a>
      ))}
    </aside>
  )
}
