import { Activity, BookOpen, ChevronRight, Mail, Wrench } from 'lucide-react'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'
import SVG from 'react-inlinesvg'
import { AiIconAnimation } from 'ui'

import type { HelpOptionId } from './HelpPanel.constants'
import { HELP_OPTION_IDS } from './HelpPanel.constants'
import type { SupportFormUrlKeys } from '@/components/interfaces/Support/SupportForm.utils'
import { createSupportFormUrl } from '@/components/interfaces/Support/SupportForm.utils'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { takeBreadcrumbSnapshot } from '@/lib/breadcrumbs'
import { DOCS_URL } from '@/lib/constants'

const DISCORD_URL = 'https://discord.supabase.com'
const STATUS_URL = 'https://status.supabase.com'

type HelpOptionsListProps = {
  excludeIds?: HelpOptionId[]
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => boolean | void
}

type HelpOption = {
  media: ReactNode
  title: string
  description: string
  href?: string
  onClick?: () => void
}

export const HelpOptionsList = ({
  excludeIds = [],
  isPlatform,
  projectRef,
  supportLinkQueryParams,
  onAssistantClick,
  onSupportClick,
}: HelpOptionsListProps) => {
  const router = useRouter()
  const basePath = router.basePath ?? ''

  const ids = HELP_OPTION_IDS.filter((id) => !excludeIds.includes(id))

  const include = (id: HelpOptionId): boolean => {
    if (id === 'assistant') return !!projectRef
    if (id === 'status' || id === 'support') return isPlatform
    return true
  }

  const filteredIds = ids.filter(include)

  const handleSupportClick = () => {
    const shouldNavigate = onSupportClick?.()
    if (shouldNavigate === false) {
      return
    }

    takeBreadcrumbSnapshot()
    router.push(createSupportFormUrl(supportLinkQueryParams ?? {}))
  }

  const renderOption = (title: string, description: string) => (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm text-foreground">{title}</p>
      <p className="text-xs text-foreground-lighter">{description}</p>
    </div>
  )

  const options: Record<HelpOptionId, HelpOption> = {
    assistant: {
      media: <AiIconAnimation allowHoverEffect size={14} />,
      title: 'Supabase Assistant',
      description: 'Get guided help with your project directly in Studio.',
      onClick: onAssistantClick,
    },
    docs: {
      media: <BookOpen strokeWidth={1.5} size={14} />,
      title: 'Docs',
      description: 'Browse guides, references, and product documentation.',
      href: `${DOCS_URL}/`,
    },
    troubleshooting: {
      media: <Wrench strokeWidth={1.5} size={14} />,
      title: 'Troubleshooting',
      description: 'Find fixes for common platform issues and errors.',
      href: `${DOCS_URL}/guides/troubleshooting?products=platform`,
    },
    discord: {
      media: <SVG src={`${basePath}/img/discord-icon.svg`} className="h-4 w-4" />,
      title: 'Ask on Discord',
      description: 'Get help from the community on code-related questions.',
      href: DISCORD_URL,
    },
    status: {
      media: <Activity strokeWidth={1.5} size={14} />,
      title: 'Supabase status',
      description: 'Check incidents, maintenance, and uptime updates.',
      href: STATUS_URL,
    },
    support: {
      media: <Mail strokeWidth={1.5} size={14} />,
      title: 'Contact support',
      description: 'Reach support for account and platform issues.',
      onClick: handleSupportClick,
    },
  }

  return (
    <ResourceList className="rounded-none border-0 bg-transparent shadow-none">
      {filteredIds.map((id) => {
        const option = options[id]

        if (option.href) {
          return (
            <ResourceItem
              key={id}
              className="!border-b"
              media={option.media}
              meta={<ChevronRight strokeWidth={1.5} size={16} />}
              href={option.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              {renderOption(option.title, option.description)}
            </ResourceItem>
          )
        }

        return (
          <ResourceItem
            key={id}
            className="!border-b"
            media={option.media}
            onClick={option.onClick}
          >
            {renderOption(option.title, option.description)}
          </ResourceItem>
        )
      })}
    </ResourceList>
  )
}
