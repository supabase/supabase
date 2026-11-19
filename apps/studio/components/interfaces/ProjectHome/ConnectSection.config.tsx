import {
  BoxIcon,
  CableIcon,
  DatabaseIcon,
  KeyRoundIcon,
  ServerIcon,
  SparklesIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { ConnectMode } from '../ConnectSheet/Connect.types'

export type ConnectAction = {
  id: ConnectMode | 'api_keys'
  heading: string
  subheading: string
  icon: ReactNode
  mode?: ConnectMode
  href?: string
  requiresActiveProject?: boolean
}

export const CONNECT_ACTIONS: ConnectAction[] = [
  {
    id: 'framework',
    mode: 'framework',
    heading: 'Framework',
    subheading: 'Use a client library',
    icon: <BoxIcon size={16} strokeWidth={1.5} />,
  },
  {
    id: 'server',
    mode: 'server',
    heading: 'Server',
    subheading: 'Build APIs',
    icon: <ServerIcon size={16} strokeWidth={1.5} />,
  },
  {
    id: 'direct',
    mode: 'direct',
    heading: 'Direct',
    subheading: 'Connection string',
    icon: <DatabaseIcon size={16} strokeWidth={1.5} />,
  },
  {
    id: 'orm',
    mode: 'orm',
    heading: 'ORM',
    subheading: 'Third-party library',
    icon: <CableIcon size={16} strokeWidth={1.5} />,
  },
  {
    id: 'mcp',
    mode: 'mcp',
    heading: 'MCP',
    subheading: 'Connect your agent',
    icon: <SparklesIcon size={16} strokeWidth={1.5} />,
  },
  {
    id: 'api_keys',
    heading: 'API Keys',
    subheading: 'Manage project keys',
    icon: <KeyRoundIcon size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/settings/api-keys',
    requiresActiveProject: false,
  },
]
