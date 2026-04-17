import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  WarningIcon,
} from 'ui'

import { IS_PLATFORM } from '@/lib/constants'

const IPv4StatusIcon = ({ className, active }: { className?: string; active: boolean }) => {
  return (
    <div className={cn('relative inline-flex', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1"
        stroke="currentColor"
        className="size-6 stroke-foreground-lighter"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
        />
      </svg>

      {!active ? (
        <div className="absolute -right-1.5 -top-1.5 bg-destructive rounded w-4 h-4 flex items-center justify-center">
          <X size={10} strokeWidth={4} className="text-white rounded-full" />
        </div>
      ) : (
        <div className="absolute -right-1.5 -top-1.5 bg-brand-500 rounded w-4 h-4 flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.33325 2.5L3.74992 7.08333L1.66659 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export interface IPv4Status {
  type: 'error' | 'success'
  title: string
  description?: string | ReactNode
  links?: { text: string; url: string }[]
}

interface IPv4StatusPanelProps {
  method: 'direct' | 'transaction' | 'session'
  ipv4Status: IPv4Status
  projectRef: string
}

export function IPv4StatusPanel({ method, ipv4Status, projectRef }: IPv4StatusPanelProps) {
  if (!IS_PLATFORM) return null

  const links = ipv4Status.links ?? []

  return (
    <div className="flex flex-col -space-y-px w-full">
      {method === 'session' ? (
        <div className="border border-muted px-5 flex gap-7 items-center py-3 rounded bg-alternative/50">
          <div className="flex w-6 h-6 rounded items-center justify-center gap-2 flex-shrink-0 bg-surface-100">
            <WarningIcon />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-foreground">Only use on a IPv4 network</span>
            <div className="flex flex-col text-xs text-foreground-lighter">
              <p>Session pooler connections are IPv4 proxied for free.</p>
              <p>Use Direct Connection if connecting via an IPv6 network.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'border border-muted px-5 flex gap-7 items-center py-3 first:rounded-t',
              ipv4Status.type === 'error' ? 'rounded-b-none' : 'last:rounded-b'
            )}
          >
            <div className="flex items-center gap-2">
              <IPv4StatusIcon active={ipv4Status.type === 'success'} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-foreground">{ipv4Status.title}</span>
              {ipv4Status.description &&
                (typeof ipv4Status.description === 'string' ? (
                  <span className="text-xs text-foreground-lighter">{ipv4Status.description}</span>
                ) : (
                  ipv4Status.description
                ))}
              {links.length > 0 && (
                <div className="flex items-center gap-x-2 mt-2">
                  {links.map((link) => (
                    <Button key={link.text} asChild type="default" size="tiny">
                      <Link href={link.url} className="text-xs text-light hover:text-foreground">
                        {link.text}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {ipv4Status.type === 'error' && (
            <Collapsible_Shadcn_ className="group -space-y-px">
              <CollapsibleTrigger_Shadcn_
                asChild
                className="group/collapse w-full justify-start rounded-t-none !last:rounded-b group-data-[state=open]:rounded-b-none border-muted"
              >
                <Button
                  type="default"
                  size="tiny"
                  className="text-foreground-lighter !bg-dash-sidebar"
                  icon={
                    <ChevronRight
                      className={cn(
                        'group-data-[state=open]/collapse:rotate-90 text-foreground-muted transition-transform'
                      )}
                    />
                  }
                >
                  Some platforms are IPv4-only:
                </Button>
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_ className="bg-dash-sidebar rounded-b border px-3 py-2">
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-foreground-light max-w-xs">
                    A few major platforms are IPv4-only and may not work with a Direct Connection:
                  </p>
                  <div className="flex gap-4">
                    <div className="text-foreground text-xs">Vercel</div>
                    <div className="text-foreground text-xs">GitHub Actions</div>
                    <div className="text-foreground text-xs">Render</div>
                    <div className="text-foreground text-xs">Retool</div>
                  </div>
                  <p className="text-xs text-foreground-lighter max-w-xs">
                    If you wish to use a Direct Connection with these, please purchase{' '}
                    <Link
                      href={`/project/${projectRef}/settings/addons?panel=ipv4`}
                      className="text-xs text-light hover:text-foreground"
                    >
                      IPv4 support
                    </Link>
                    .
                  </p>
                  <p className="text-xs text-foreground-lighter max-w-xs">
                    You may also use the{' '}
                    <span className="text-foreground-light">Session Pooler</span> or{' '}
                    <span className="text-foreground-light">Transaction Pooler</span> if you are on
                    a IPv4 network.
                  </p>
                </div>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          )}
        </>
      )}
    </div>
  )
}
