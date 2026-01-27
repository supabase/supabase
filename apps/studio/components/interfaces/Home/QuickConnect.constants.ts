import {
  FRAMEWORKS,
  MOBILES,
  ORMS,
  connectionStringMethodOptions,
} from 'components/interfaces/Connect/Connect.constants'

export type QuickConnectNuqsTarget = {
  tab?: 'direct' | 'frameworks' | 'mobiles' | 'orms' | 'api-keys' | 'mcp'
  framework?: string
  method?: 'direct' | 'transaction' | 'session'
}

export type QuickConnectLeftItem = {
  id: string
  label: string
  icon?: string
  target?: QuickConnectNuqsTarget
}

export type QuickConnectSection = {
  id: string
  label: string
  items: QuickConnectLeftItem[]
}

export type QuickConnectColumn = {
  id: string
  sections: QuickConnectSection[]
}

export type QuickConnectLeftConfig = {
  title: string
  description: string
  columns: QuickConnectColumn[]
}

export type QuickConnectRightCardConfig = {
  title: string
  description: string
  docsHref: string
  docsLabel: string
  primaryActionLabel: string
}

const mapConnectionTypesToQuickItems = (
  items: { key: string; label: string; icon: string }[],
  tab: QuickConnectNuqsTarget['tab']
): QuickConnectLeftItem[] =>
  items.map((item) => ({
    id: item.key,
    label: item.label,
    icon: item.icon,
    target: { tab, framework: item.key },
  }))

export const QUICK_CONNECT_LEFT_CONFIG: QuickConnectLeftConfig = {
  title: 'Quick Connect',
  description: 'Choose your way of interacting with your database.',
  columns: [
    {
      id: 'connection-string',
      sections: [
        {
          id: 'connection-string-section',
          label: 'Connection String',
          items: [
            {
              id: 'direct-connection',
              label: connectionStringMethodOptions.direct.label,
              target: { tab: 'direct', method: 'direct' },
            },
            {
              id: 'transaction-pooler',
              label: connectionStringMethodOptions.transaction.label,
              target: { tab: 'direct', method: 'transaction' },
            },
            {
              id: 'session-pooler',
              label: connectionStringMethodOptions.session.label,
              target: { tab: 'direct', method: 'session' },
            },
          ],
        },
        {
          id: 'orms-section',
          label: 'ORMs',
          items: mapConnectionTypesToQuickItems(ORMS, 'orms'),
        },
      ],
    },
    {
      id: 'app-frameworks',
      sections: [
        {
          id: 'app-frameworks-section',
          label: 'App Frameworks',
          items: mapConnectionTypesToQuickItems(FRAMEWORKS, 'frameworks'),
        },
      ],
    },
    {
      id: 'mobile-and-mcp',
      sections: [
        {
          id: 'mobile-frameworks-section',
          label: 'Mobile Frameworks',
          items: mapConnectionTypesToQuickItems(MOBILES, 'mobiles'),
        },
        {
          id: 'mcp-section',
          label: 'MCP',
          items: [
            {
              id: 'mcp-connection',
              label: 'MCP connection',
              icon: 'mcp',
              target: { tab: 'mcp' },
            },
          ],
        },
      ],
    },
  ],
}

export const QUICK_CONNECT_RIGHT_CARD_CONFIG: QuickConnectRightCardConfig = {
  title: 'Project API',
  description: 'Connect to your project directly or via client libraries.',
  docsHref: '/guides/database/connecting-to-postgres',
  docsLabel: 'Learn how to connect to your Postgres databases',
  primaryActionLabel: 'View connection settings',
}
