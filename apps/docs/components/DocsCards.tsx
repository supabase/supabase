import type { ReactNode } from 'react'

import { Datadog, Grafana } from 'icons'
import {
  Activity,
  BarChart3,
  Blocks,
  Flame,
  Gauge,
  GitBranch,
  Hammer,
  ListChecks,
  ScrollText,
  Search,
  ShieldCheck,
} from 'lucide-react'

import { GuideCardGrid, type GuideCardItem } from './GuideCardGrid'

type DocsCardIconKey =
  | 'activity'
  | 'barChart'
  | 'blocks'
  | 'datadog'
  | 'flame'
  | 'gauge'
  | 'gitBranch'
  | 'hammer'
  | 'grafana'
  | 'listChecks'
  | 'scrollText'
  | 'search'
  | 'shieldCheck'

type IconConfig = {
  icon: ReactNode
  iconColor: string
  iconBg: string
}

const DEFAULT_ICON_COLOR = '#0BA678'
const DEFAULT_ICON_BG = 'rgba(11,166,120,0.12)'

const ICONS: Record<DocsCardIconKey, IconConfig> = {
  activity: { icon: <Activity className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  barChart: { icon: <BarChart3 className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  blocks: { icon: <Blocks className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  datadog: { icon: <Datadog className="h-5 w-5" />, iconColor: '#632CA6', iconBg: 'rgba(99,44,166,0.1)' },
  flame: {
    icon: <Flame className="h-5 w-5" strokeWidth={1.5} />,
    iconColor: DEFAULT_ICON_COLOR,
    iconBg: 'rgba(11,166,120,0.1)',
  },
  gauge: { icon: <Gauge className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  gitBranch: { icon: <GitBranch className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  hammer: { icon: <Hammer className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  grafana: { icon: <Grafana className="h-5 w-5" />, iconColor: '#F05A28', iconBg: 'rgba(240,90,40,0.1)' },
  listChecks: { icon: <ListChecks className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  scrollText: { icon: <ScrollText className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  search: { icon: <Search className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
  shieldCheck: { icon: <ShieldCheck className="h-5 w-5" />, iconColor: DEFAULT_ICON_COLOR, iconBg: DEFAULT_ICON_BG },
}

export type DocsCardItem = Omit<GuideCardItem, 'icon' | 'iconColor' | 'iconBg'> & {
  icon?: DocsCardIconKey
  iconColor?: string
  iconBg?: string
}

export function DocsCards({
  items,
  columnsClassName,
}: {
  items: DocsCardItem[]
  columnsClassName?: string
}) {
  const mappedItems: GuideCardItem[] = items.map((item) => {
    const config = item.icon ? ICONS[item.icon] : undefined

    return {
      ...item,
      icon: config?.icon,
      iconColor: item.iconColor ?? config?.iconColor,
      iconBg: item.iconBg ?? config?.iconBg,
    }
  })

  return <GuideCardGrid items={mappedItems} columnsClassName={columnsClassName} />
}
