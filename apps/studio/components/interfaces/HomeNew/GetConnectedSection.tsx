import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { Box, Cable, Database, Sparkles } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { Card, CardContent, cn } from 'ui'

import type { ConnectMode } from '../ConnectSheet/Connect.types'

type ConnectAction = {
  mode: ConnectMode
  heading: string
  subheading: string
  icon: ReactNode
}

const CONNECT_ACTIONS: ConnectAction[] = [
  {
    mode: 'framework',
    heading: 'Framework',
    subheading: 'Use a client library',
    icon: <Box size={16} strokeWidth={1.5} />,
  },
  {
    mode: 'direct',
    heading: 'Direct',
    subheading: 'Connection string',
    icon: <Database size={16} strokeWidth={1.5} />,
  },
  {
    mode: 'orm',
    heading: 'ORM',
    subheading: 'Third-party library',
    icon: <Cable size={16} strokeWidth={1.5} />,
  },
  {
    mode: 'mcp',
    heading: 'MCP',
    subheading: 'Connect your agent',
    icon: <Sparkles size={16} strokeWidth={1.5} />,
  },
]

export const GetConnectedSection = () => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const handleConnectClick = (mode: ConnectMode) => {
    setConnectTab(mode)
    setShowConnect(true)
  }

  return (
    <section className="w-full">
      <div className="mb-6">
        <h3 className="heading-section">Get connected</h3>
      </div>

      <Card className="bg-background/25 border-dashed relative overflow-hidden">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>

        <CardContent className="relative z-10 p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-muted">
            {CONNECT_ACTIONS.map((action) => (
              <button
                key={action.mode}
                type="button"
                disabled={!isActiveHealthy}
                onClick={() => handleConnectClick(action.mode)}
                className={cn(
                  'group flex flex-col items-center justify-center gap-3 p-6 text-center transition-colors min-h-32',
                  'hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  !isActiveHealthy && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="text-foreground-light group-hover:text-foreground">
                  {action.icon}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm">{action.heading}</p>
                  <p className="text-sm text-foreground-lighter">{action.subheading}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
