'use client'

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
import Link from 'next/link'
import { ReactNode, useMemo, useState } from 'react'

import { Button } from '@/registry/default/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/registry/default/components/ui/dialog'
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
import { AuthManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/auth'
import { DatabaseManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/database'
import { LogsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/logs'
import { SecretsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/secrets'
import { StorageManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/storage'
import { SuggestionsManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/suggestions'
import { UsersManager } from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager/users'
import {
  SheetNavigationProvider,
  useSheetNavigation,
} from '@/registry/default/platform/platform-kit-nextjs/contexts/SheetNavigationContext'

const queryClient = new QueryClient()

function DialogView({ projectRef, isMobile }: { projectRef: string; isMobile?: boolean }) {
  const { stack, push, popTo, reset } = useSheetNavigation()

  const handleTopLevelNavigation = (title: string, component: ReactNode) => {
    if (stack.length === 1 && stack[0].title === title) {
      return
    }
    reset()
    push({ title, component })
  }

  const currentView = stack[stack.length - 1]
  const activeManager = stack.length > 0 ? stack[0].title : null

  const navigationItems = useMemo(
    () => [
      {
        title: 'Database',
        icon: Database,
        component: <DatabaseManager projectRef={projectRef} />,
      },
      {
        title: 'Storage',
        icon: HardDrive,
        component: <StorageManager projectRef={projectRef} />,
      },
      {
        title: 'Auth',
        icon: Shield,
        component: <AuthManager projectRef={projectRef} />,
      },
      {
        title: 'Users',
        icon: Users,
        component: <UsersManager projectRef={projectRef} />,
      },
      {
        title: 'Secrets',
        icon: KeyRound,
        component: <SecretsManager projectRef={projectRef} />,
      },
      {
        title: 'Logs',
        icon: ScrollText,
        component: <LogsManager projectRef={projectRef} />,
      },
      {
        title: 'Suggestions',
        icon: Lightbulb,
        component: <SuggestionsManager projectRef={projectRef} />,
      },
    ],
    [projectRef]
  )

  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Content Area */}
        <div className="flex flex-col overflow-hidden h-full">
          <div className="grow overflow-y-auto">
            {currentView ? (
              currentView.component
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a manager from the bottom navigation to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="border-t bg-background">
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-2 min-w-max">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.title}
                    variant={activeManager === item.title ? 'secondary' : 'ghost'}
                    className="flex-col h-16 w-20 min-w-16 text-xs gap-1 px-2"
                    onClick={() => handleTopLevelNavigation(item.title, item.component)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] leading-tight text-center">
                      {item.title === 'Auth' ? 'Auth' : item.title}
                    </span>
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
    <div className="grid grid-cols-[240px_1fr] h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex flex-col border-r px-3 py-6 pb-3">
        <div className="px-4 mb-4">
          <h2 className="text-muted-foreground font-semibold text-sm">Manage your back-end</h2>
        </div>
        <div className="grow space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.title}
                variant={activeManager === item.title ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => handleTopLevelNavigation(item.title, item.component)}
              >
                <Icon className="mr-2 text-muted-foreground" />
                {item.title === 'Auth' ? 'Authentication' : item.title}
              </Button>
            )
          })}
        </div>
        <footer className="p-0 text-sm text-muted-foreground flex items-center gap-3 -m-3 border-t">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Link
                href={`https://supabase.com/dashboard/project/${projectRef}`}
                target="_blank"
                className="flex items-center px-4 w-full rounded-none text-sm py-4 h-auto justify-start gap-3 text-sm text-left hover:bg-accent"
              >
                <LogoSupabase size={16} />
                <span className="flex-1">Open in Supabase</span>
                <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground/50" />
              </Link>
            </HoverCardTrigger>
            <HoverCardContent
              sideOffset={8}
              align="start"
              side="top"
              className="text-sm bg-muted/50 w-[216px]"
            >
              <h4 className="font-semibold mb-1">About Supabase</h4>
              <p className="text-muted-foreground">
                Access powerful back-end tools for database, auth, storage, and logs directly in
                Supabase.
              </p>
            </HoverCardContent>
          </HoverCard>
        </footer>
      </div>

      {/* Content Area */}
      <div className="flex flex-col overflow-hidden h-full">
        {/* Header with breadcrumbs */}
        <div className="flex items-center h-12 shrink-0 px-4 relative border-b">
          {stack.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 relative z-10"
              onClick={() => popTo(stack.length - 2)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          {/* Breadcrumbs */}
          <div className="ml-4 flex items-center gap-1.5 text-sm text-muted-foreground relative z-10">
            {stack.map((item: { title: string }, index: number) => (
              <div key={`${item.title}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {index === stack.length - 1 ? (
                  <span className="font-semibold text-foreground">{item.title}</span>
                ) : (
                  <button onClick={() => popTo(index)} className="hover:underline">
                    {item.title}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grow overflow-y-auto">
          {currentView ? (
            currentView.component
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Select a manager from the sidebar to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SupabaseManagerDialog({
  projectRef,
  open,
  onOpenChange,
  isMobile,
}: {
  projectRef: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}) {
  const content = (
    <SheetNavigationProvider
      onStackEmpty={() => {}}
      initialStack={[
        {
          title: 'Database',
          component: <DatabaseManager projectRef={projectRef} />,
        },
      ]}
    >
      <DialogView projectRef={projectRef} isMobile={isMobile} />
    </SheetNavigationProvider>
  )

  if (!isMobile) {
    return (
      <QueryClientProvider client={queryClient}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-full h-[80vh] max-h-[700px] sm:max-w-[calc(100%-2rem)] w-[1180px] p-0 overflow-hidden sm:rounded-lg">
            <DialogTitle className="sr-only">Manage your back-end</DialogTitle>
            {content}
          </DialogContent>
        </Dialog>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] p-0 overflow-hidden">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Manage your back-end</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    </QueryClientProvider>
  )
}
