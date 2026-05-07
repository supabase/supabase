import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

const CONNECT_SURFACE_OPTIONS = [
  {
    id: 'authorize',
    label: 'API / MCP authorization',
    route: '/authorize',
    mock: 'mcp',
    href: '/authorize?mock=mcp',
  },
  {
    id: 'join',
    label: 'Organization invite',
    route: '/join',
    mock: 'ready',
    href: '/join?mock=ready',
  },
  {
    id: 'redeem',
    label: 'Redeem credits',
    route: '/redeem',
    mock: 'ready',
    href: '/redeem?mock=ready',
  },
  {
    id: 'aws-marketplace',
    label: 'AWS Marketplace',
    route: '/aws-marketplace-onboarding',
    mock: 'link-existing',
    href: '/aws-marketplace-onboarding?mock=link-existing',
  },
  {
    id: 'cli-login',
    label: 'CLI login',
    route: '/cli/login',
    mock: 'ready',
    href: '/cli/login?mock=ready',
  },
  {
    id: 'stripe-projects',
    label: 'Stripe Projects',
    route: '/partners/stripe/projects/login',
    mock: 'pending',
    href: '/partners/stripe/projects/login?mock=pending',
  },
  {
    id: 'vercel-install',
    label: 'Vercel install',
    route: '/integrations/vercel/install',
    mock: 'ready',
    href: '/integrations/vercel/install?mock=ready',
  },
  {
    id: 'vercel-project-connection',
    label: 'Vercel project connection',
    route: '/integrations/vercel/[slug]/marketplace/choose-project',
    mock: 'ready',
    href: '/integrations/vercel/acme-production/marketplace/choose-project?mock=ready&configurationId=mock-configuration-id',
  },
  {
    id: 'vercel-project-creation',
    label: 'Vercel project creation',
    route: '/integrations/vercel/[slug]/deploy-button/new-project',
    mock: 'ready',
    href: '/integrations/vercel/acme-production/deploy-button/new-project?mock=ready&currentProjectId=mock-vercel-project&externalId=mock-repository',
  },
] as const

type ConnectSurfaceOption = (typeof CONNECT_SURFACE_OPTIONS)[number]

const getCurrentSurface = (pathname: string, mock: unknown): ConnectSurfaceOption => {
  const exactMatch = CONNECT_SURFACE_OPTIONS.find(
    (option) => option.route === pathname && option.mock === mock
  )
  const routeMatch = CONNECT_SURFACE_OPTIONS.find((option) => option.route === pathname)

  return exactMatch ?? routeMatch ?? CONNECT_SURFACE_OPTIONS[0]
}

export const isTemporaryConnectMockPreviewEnabled = () => {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod') return true
  if (typeof window === 'undefined') return false

  return window.location.hostname.endsWith('.vercel.app')
}

export const getConnectMockState = <TState extends string>(
  value: unknown,
  states: readonly TState[]
): TState | undefined => {
  return typeof value === 'string' && states.includes(value as TState)
    ? (value as TState)
    : undefined
}

export const ConnectPreviewToolbar = ({ children }: PropsWithChildren) => (
  <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
    <ConnectSurfaceMenu />
    {children}
  </div>
)

const ConnectSurfaceMenu = () => {
  const router = useRouter()
  const currentSurface = getCurrentSurface(router.pathname, router.query.mock)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="default" size="tiny" className="font-mono">
          surface: {currentSurface.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuRadioGroup
          value={currentSurface.id}
          onValueChange={(value) => {
            const surface = CONNECT_SURFACE_OPTIONS.find((option) => option.id === value)
            if (!surface) return
            router.push(surface.href)
          }}
        >
          {CONNECT_SURFACE_OPTIONS.map((surface) => (
            <DropdownMenuRadioItem key={surface.id} value={surface.id} className="text-xs">
              {surface.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const ConnectMockMenu = <TState extends string>({
  state,
  states,
  onSelect,
  width = 'w-[220px]',
}: {
  state: TState
  states: readonly TState[]
  onSelect: (state: TState) => void
  width?: string
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="warning" size="tiny" className="font-mono">
        mock: {state}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={width}>
      <DropdownMenuRadioGroup value={state} onValueChange={(value) => onSelect(value as TState)}>
        {states.map((item) => (
          <DropdownMenuRadioItem key={item} value={item} className="font-mono text-xs">
            {item}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)
