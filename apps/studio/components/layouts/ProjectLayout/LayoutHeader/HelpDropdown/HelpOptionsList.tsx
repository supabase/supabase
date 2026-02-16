import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DOCS_URL } from 'lib/constants'
import { Activity, BookOpen, Mail, Wrench } from 'lucide-react'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'
import { AiIconAnimation, ButtonGroup, ButtonGroupItem } from 'ui'

import type { HelpOptionId } from './HelpDropdown.constants'
import { HELP_OPTION_IDS } from './HelpDropdown.constants'

const DISCORD_URL = 'https://discord.supabase.com'
const STATUS_URL = 'https://status.supabase.com'

type HelpOptionsListProps = {
  excludeIds?: HelpOptionId[]
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => void
  size?: 'tiny' | 'small'
}

export const HelpOptionsList = ({
  excludeIds = [],
  isPlatform,
  projectRef,
  supportLinkQueryParams,
  onAssistantClick,
  onSupportClick,
  size = 'tiny',
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

  return (
    <ButtonGroup className="w-full">
      {filteredIds.map((id) => {
        switch (id) {
          case 'assistant':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<AiIconAnimation allowHoverEffect size={14} />}
                onClick={onAssistantClick}
              >
                Supabase Assistant
              </ButtonGroupItem>
            )
          case 'docs':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<BookOpen strokeWidth={1.5} size={14} />}
                asChild
              >
                <a href={`${DOCS_URL}/`} target="_blank" rel="noreferrer">
                  Docs
                </a>
              </ButtonGroupItem>
            )
          case 'troubleshooting':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<Wrench strokeWidth={1.5} size={14} />}
                asChild
              >
                <a
                  href={`${DOCS_URL}/guides/troubleshooting?products=platform`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Troubleshooting
                </a>
              </ButtonGroupItem>
            )
          case 'discord':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<SVG src={`${basePath}/img/discord-icon.svg`} className="h-4 w-4" />}
                asChild
              >
                <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                  Ask on Discord
                </a>
              </ButtonGroupItem>
            )
          case 'status':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<Activity strokeWidth={1.5} size={14} />}
                asChild
              >
                <a href={STATUS_URL} target="_blank" rel="noreferrer">
                  Supabase status
                </a>
              </ButtonGroupItem>
            )
          case 'support':
            return (
              <ButtonGroupItem
                key={id}
                size={size}
                icon={<Mail strokeWidth={1.5} size={14} />}
                asChild
              >
                <SupportLink queryParams={supportLinkQueryParams} onClick={onSupportClick}>
                  Contact support
                </SupportLink>
              </ButtonGroupItem>
            )
          default: {
            const _exhaustive: never = id
            return null
          }
        }
      })}
    </ButtonGroup>
  )
}
