import { Box, Cable, Database, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ConnectMode } from '../ConnectSheet/Connect.types'

// Temporary: experiment variants for the connectSection A/B test. Remove after the experiment.
export type ConnectSectionVariant = 'connect' | 'getting-started'

export type ConnectAction = {
  mode: ConnectMode
  heading: string
  subheading: string
  icon: ReactNode
}

export const CONNECT_ACTIONS: ConnectAction[] = [
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
