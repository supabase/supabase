import { useParams } from 'common'
import { ArrowUpRight, BookOpen, LayoutGrid, PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DOCS_URL } from '@/lib/constants'

const sectionLabelCls =
  'px-2 pt-4 pb-1.5 font-mono text-xs uppercase tracking-wider text-foreground-lighter'

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
      <span className="font-mono text-xs text-foreground-lighter">{count}</span>
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

  const { installedIntegrations, isLoading } = useInstalledIntegrations()

  const baseHref = `/project/${ref}/integrations`
  const isDiscoverActive =
    router.pathname === '/project/[ref]/integrations' && !router.query.type && !router.query.source
  const activeIntegrationId = typeof router.query.id === 'string' ? router.query.id : undefined

  return (
    <aside className="grow flex h-full w-full flex-col gap-y-0.5 overflow-y-auto p-4 text-sm">
      <SidebarLink
        href={baseHref}
        active={isDiscoverActive}
        icon={<LayoutGrid size={13} />}
        label="Explore all"
      />

      {isLoading ? (
        <>
          <div className={sectionLabelCls}>Installed</div>
          <div className="space-y-1">
            <ShimmeringLoader />
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        </>
      ) : installedIntegrations.length > 0 ? (
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
      ) : null}

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
