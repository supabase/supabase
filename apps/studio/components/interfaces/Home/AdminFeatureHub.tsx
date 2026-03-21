import { useParams } from 'common'
import Link from 'next/link'
import {
  Database,
  FileSpreadsheet,
  KeyRound,
  Logs,
  Shield,
  TableProperties,
  Table2,
  Ticket,
  Warehouse,
} from 'lucide-react'
import { Badge, Card, cn } from 'ui'

const shortcutCards = [
  {
    title: 'Platform Credentials',
    description: 'Reveal, copy, and rotate the anon and service keys for this project.',
    href: (ref: string) => `/project/${ref}/settings/credentials`,
    icon: KeyRound,
    badge: 'Custom',
  },
  {
    title: 'Invite Codes',
    description: 'Create and manage invite codes used for tenant user registration.',
    href: (ref: string) => `/project/${ref}/invite-codes`,
    icon: Ticket,
    badge: 'Custom',
  },
  {
    title: 'Database',
    description: 'Open the table editor for the tenant schema and core application data.',
    href: (ref: string) => `/project/${ref}/editor`,
    icon: Database,
    badge: 'Core',
  },
  {
    title: 'Admin Tables',
    description: 'Open the Table Editor focused on platform-managed schemas and records.',
    href: (ref: string) => `/project/${ref}/editor?schema=_admin`,
    icon: Table2,
    badge: 'Custom',
  },
  {
    title: 'Auth Users',
    description: 'Review registered users, identities, and tenant account metadata.',
    href: (ref: string) => `/project/${ref}/auth/users`,
    icon: Shield,
    badge: 'Core',
  },
  {
    title: 'Storage',
    description: 'Inspect buckets and uploaded assets managed by this tenant project.',
    href: (ref: string) => `/project/${ref}/storage/buckets`,
    icon: Warehouse,
    badge: 'Core',
  },
  {
    title: 'Edge Functions',
    description: 'Inspect the register, Drive, chat, and embedding function surfaces.',
    href: (ref: string) => `/project/${ref}/functions`,
    icon: FileSpreadsheet,
    badge: 'Core',
  },
  {
    title: 'Logs Explorer',
    description: 'Debug requests, function activity, and platform behavior from one place.',
    href: (ref: string) => `/project/${ref}/logs/explorer`,
    icon: Logs,
    badge: 'Core',
  },
  {
    title: 'Project Settings',
    description: 'Adjust project configuration, infrastructure, auth, and API settings.',
    href: (ref: string) => `/project/${ref}/settings/general`,
    icon: TableProperties,
    badge: 'Core',
  },
] as const

export const AdminFeatureHub = () => {
  const { ref } = useParams()

  if (!ref) return null

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg text-foreground">Admin shortcuts</h2>
        <p className="text-sm text-foreground-light">
          Start from the tools that actually matter for managing this tenant project.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shortcutCards.map((card) => {
          const Icon = card.icon

          return (
            <Link key={card.title} href={card.href(ref)}>
              <Card
                className={cn(
                  'h-full border border-default bg-surface-100 p-4 transition-colors',
                  'hover:border-foreground-muted hover:bg-surface-200'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface-200">
                    <Icon size={16} className="text-foreground-light" />
                  </div>
                  {card.badge && (
                    <Badge variant="warning" className="flex-shrink-0 text-[10px] uppercase">
                      {card.badge}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-1.5">
                  <h3 className="text-sm font-medium text-foreground">{card.title}</h3>
                  <p className="text-xs leading-5 text-foreground-light">{card.description}</p>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
