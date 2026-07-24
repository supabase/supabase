import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  HardDrive,
  KeyRound,
  Lightbulb,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ComponentType } from 'react'
import { Route, Router, Switch, useLocation } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { Button } from '@/registry/default/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/registry/default/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/registry/default/components/ui/drawer'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/default/components/ui/hover-card'
import { LogoSupabase } from '@/registry/default/platform/platform-kit-nextjs/components/logo-supabase'
import {
  AuthManager,
  AuthProviderView,
} from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/auth'
import {
  DatabaseManager,
  DatabaseQueryView,
  EditRowView,
  TableRecordsView,
} from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/database'
import { LogsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/logs'
import { ManagerStateProvider } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/manager-state'
import { SecretsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/secrets'
import { StorageManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/storage'
import { SuggestionsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/suggestions'
import { UsersManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/users'
import {
  PlatformProvider,
  useFeatures,
  usePlatformAdapter,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import type { PlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'
import { buildBreadcrumbs } from '@/registry/default/platform/platform-kit-nextjs/lib/router'

interface NavItem {
  key: string
  path: string
  title: string
  label: string
  icon: ComponentType<{ className?: string }>
  show: boolean
}

function useNavItems(): NavItem[] {
  const features = useFeatures()
  return [
    {
      key: 'database',
      path: '/database',
      title: 'Database',
      label: 'Database',
      icon: Database,
      show: features.introspection,
    },
    {
      key: 'storage',
      path: '/storage',
      title: 'Storage',
      label: 'Storage',
      icon: HardDrive,
      show: features.storage,
    },
    {
      key: 'auth',
      path: '/auth',
      title: 'Authentication',
      label: 'Auth',
      icon: Shield,
      show: features.authConfig,
    },
    {
      key: 'users',
      path: '/users',
      title: 'Users',
      label: 'Users',
      icon: Users,
      show: features.authUsers,
    },
    {
      key: 'secrets',
      path: '/secrets',
      title: 'Secrets',
      label: 'Secrets',
      icon: KeyRound,
      show: features.secrets,
    },
    {
      key: 'logs',
      path: '/logs',
      title: 'Logs',
      label: 'Logs',
      icon: ScrollText,
      show: features.logs,
    },
    {
      key: 'suggestions',
      path: '/suggestions',
      title: 'Suggestions',
      label: 'Suggestions',
      icon: Lightbulb,
      show: features.advisors,
    },
  ].filter((item) => item.show)
}

function ManagerRoutes() {
  return (
    <Switch>
      <Route path="/database" component={DatabaseManager} />
      <Route path="/database/query" component={DatabaseQueryView} />
      <Route path="/database/:table/edit">
        {(params) => <EditRowView tableName={decodeURIComponent(params.table)} />}
      </Route>
      <Route path="/database/:table">
        {(params) => <TableRecordsView tableName={decodeURIComponent(params.table)} />}
      </Route>
      <Route path="/storage" component={StorageManager} />
      <Route path="/auth" component={AuthManager} />
      <Route path="/auth/:provider">
        {(params) => <AuthProviderView providerName={decodeURIComponent(params.provider)} />}
      </Route>
      <Route path="/users" component={UsersManager} />
      <Route path="/secrets" component={SecretsManager} />
      <Route path="/logs" component={LogsManager} />
      <Route path="/suggestions" component={SuggestionsManager} />
    </Switch>
  )
}

function DashboardLink() {
  const adapter = usePlatformAdapter()
  const url = adapter.dashboardUrl?.()
  if (!url) return null
  return (
    <footer className="-m-3 flex items-center gap-3 border-t p-0 text-sm text-muted-foreground">
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-4 text-left text-sm hover:bg-accent"
          >
            <LogoSupabase size={16} />
            <span className="flex-1">Open in Supabase</span>
            <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground/50" />
          </a>
        </HoverCardTrigger>
        <HoverCardContent
          sideOffset={8}
          align="start"
          side="top"
          className="w-[216px] bg-muted/50 text-sm"
        >
          <h4 className="mb-1 font-semibold">About Supabase</h4>
          <p className="text-muted-foreground">
            Access powerful back-end tools for database, auth, storage, and logs directly in
            Supabase.
          </p>
        </HoverCardContent>
      </HoverCard>
    </footer>
  )
}

function ManagerLayout({ isMobile }: { isMobile?: boolean }) {
  const [location, navigate] = useLocation()
  const navItems = useNavItems()
  const crumbs = buildBreadcrumbs(location)

  const isActive = (path: string) => location === path || location.startsWith(`${path}/`)

  if (isMobile) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <div className="grow overflow-y-auto">
            <ManagerRoutes />
          </div>
        </div>
        <div className="border-t bg-background">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.key}
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className="h-16 w-20 min-w-16 flex-col gap-1 px-2 text-xs"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center text-[10px] leading-tight">{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-[240px_1fr] overflow-hidden">
      {/* Sidebar */}
      <div className="flex flex-col border-r px-3 py-6 pb-3">
        <div className="mb-4 px-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Manage your back-end</h2>
        </div>
        <div className="grow space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.key}
                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-2 text-muted-foreground" />
                {item.title}
              </Button>
            )
          })}
        </div>
        <DashboardLink />
      </div>

      {/* Content */}
      <div className="flex flex-col overflow-hidden">
        <div className="relative flex h-12 shrink-0 items-center border-b px-4">
          {crumbs.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="relative z-10 h-8 w-8"
              onClick={() => navigate(crumbs[crumbs.length - 2].path)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <div className="relative z-10 ml-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {index === crumbs.length - 1 ? (
                  <span className="font-semibold text-foreground">{crumb.title}</span>
                ) : (
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => navigate(crumb.path)}
                    className="hover:underline"
                  >
                    {crumb.title}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grow overflow-y-auto">
          <ManagerRoutes />
        </div>
      </div>
    </div>
  )
}

function ManagerShell({ isMobile }: { isMobile?: boolean }) {
  const router = useMemo(() => memoryLocation({ path: '/database' }), [])
  return (
    <ManagerStateProvider>
      <Router hook={router.hook}>
        <ManagerLayout isMobile={isMobile} />
      </Router>
    </ManagerStateProvider>
  )
}

export default function SupabaseManagerDialog({
  adapter,
  open,
  onOpenChange,
  isMobile,
  queryClient,
}: {
  adapter: PlatformAdapter
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile?: boolean
  /** Optional shared QueryClient; one is created if omitted. */
  queryClient?: QueryClient
}) {
  const [fallbackClient] = useState(() => new QueryClient())
  const client = queryClient ?? fallbackClient

  const content = (
    <PlatformProvider adapter={adapter}>
      <ManagerShell isMobile={isMobile} />
    </PlatformProvider>
  )

  if (!isMobile) {
    return (
      <QueryClientProvider client={client}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="h-[80vh] max-h-[700px] w-[1180px] overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] sm:rounded-lg">
            <DialogTitle className="sr-only">Manage your back-end</DialogTitle>
            {content}
          </DialogContent>
        </Dialog>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={client}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] overflow-hidden p-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Manage your back-end</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    </QueryClientProvider>
  )
}
