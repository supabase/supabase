import { Box, Cable, Database, KeyRound, Sparkles } from 'lucide-react'
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
    icon: <Box size={16} strokeWidth={1.5} />,
  },
  {
    id: 'direct',
    mode: 'direct',
    heading: 'Direct',
    subheading: 'Connection string',
    icon: <Database size={16} strokeWidth={1.5} />,
  },
  {
    id: 'orm',
    mode: 'orm',
    heading: 'ORM',
    subheading: 'Third-party library',
    icon: <Cable size={16} strokeWidth={1.5} />,
  },
  {
    id: 'mcp',
    mode: 'mcp',
    heading: 'MCP',
    subheading: 'Connect your agent',
    icon: <Sparkles size={16} strokeWidth={1.5} />,
  },
  {
    id: 'api_keys',
    heading: 'API Keys',
    subheading: 'Manage project keys',
    icon: <KeyRound size={16} strokeWidth={1.5} />,
    href: '/project/[ref]/settings/api-keys',
    requiresActiveProject: false,
  },
]
