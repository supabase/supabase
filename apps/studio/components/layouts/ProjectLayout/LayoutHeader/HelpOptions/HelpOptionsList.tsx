import { Activity, BookOpen, Mail, Wrench } from 'lucide-react'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'

import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DOCS_URL } from 'lib/constants'
import {
  AiIconAnimation,
  Button,
  ButtonGroup,
  ButtonGroupItem,
} from 'ui'

import type { HelpOptionId } from './helpOptionsConfig'
import { HELP_OPTION_IDS } from './helpOptionsConfig'

const DISCORD_URL = 'https://discord.supabase.com'
const STATUS_URL = 'https://status.supabase.com'

type HelpOptionsListProps = {
  excludeIds?: HelpOptionId[]
  variant: 'button-group' | 'stack'
  isPlatform: boolean
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
  onAssistantClick?: () => void
  onSupportClick?: () => void
  size?: 'tiny' | 'small'
}

export const HelpOptionsList = ({
  excludeIds = [],
  variant,
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

  if (variant === 'button-group') {
    return (
      <ButtonGroup className="w-full">
        {filteredIds.map((id) => {
          if (id === 'assistant') {
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
          }
          if (id === 'docs') {
            return (
              <ButtonGroupItem key={id} size={size} icon={<BookOpen strokeWidth={1.5} size={14} />} asChild>
                <a href={`${DOCS_URL}/`} target="_blank" rel="noreferrer">
                  Docs
                </a>
              </ButtonGroupItem>
            )
          }
          if (id === 'troubleshooting') {
            return (
              <ButtonGroupItem key={id} size={size} icon={<Wrench strokeWidth={1.5} size={14} />} asChild>
                <a href={`${DOCS_URL}/guides/troubleshooting?products=platform`} target="_blank" rel="noreferrer">
                  Troubleshooting
                </a>
              </ButtonGroupItem>
            )
          }
          if (id === 'discord') {
            return (
              <ButtonGroupItem key={id} size={size} icon={<SVG src={`${basePath}/img/discord-icon.svg`} className="h-4 w-4" />} asChild>
                <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                  Ask on Discord
                </a>
              </ButtonGroupItem>
            )
          }
          if (id === 'status') {
            return (
              <ButtonGroupItem key={id} size={size} icon={<Activity strokeWidth={1.5} size={14} />} asChild>
                <a href={STATUS_URL} target="_blank" rel="noreferrer">
                  Supabase status
                </a>
              </ButtonGroupItem>
            )
          }
          if (id === 'support') {
            return (
              <ButtonGroupItem key={id} size={size} icon={<Mail strokeWidth={1.5} size={14} />} asChild>
                <SupportLink queryParams={supportLinkQueryParams} onClick={onSupportClick}>
                  Contact support
                </SupportLink>
              </ButtonGroupItem>
            )
          }
          return null
        })}
      </ButtonGroup>
    )
  }

  // variant === 'stack'
  return (
    <div className="flex flex-col gap-1.5">
      {filteredIds.map((id) => {
        if (id === 'assistant') {
          return (
            <Button
              key={id}
              type="secondary"
              size={size}
              className="justify-start"
              icon={<AiIconAnimation allowHoverEffect size={14} />}
              onClick={onAssistantClick}
            >
              Supabase Assistant
            </Button>
          )
        }
        if (id === 'docs') {
          return (
            <Button key={id} type="secondary" size={size} className="justify-start" icon={<BookOpen strokeWidth={1.5} size={14} />} asChild>
              <a href={`${DOCS_URL}/`} target="_blank" rel="noreferrer">
                Docs
              </a>
            </Button>
          )
        }
        if (id === 'troubleshooting') {
          return (
            <Button key={id} type="secondary" size={size} className="justify-start" icon={<Wrench strokeWidth={1.5} size={14} />} asChild>
              <a href={`${DOCS_URL}/guides/troubleshooting?products=platform`} target="_blank" rel="noreferrer">
                Troubleshooting
              </a>
            </Button>
          )
        }
        if (id === 'discord') {
          return (
            <Button key={id} type="secondary" size={size} className="justify-start" icon={<SVG src={`${basePath}/img/discord-icon.svg`} className="h-4 w-4" />} asChild>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                Ask on Discord
              </a>
            </Button>
          )
        }
        if (id === 'status') {
          return (
            <Button key={id} type="secondary" size={size} className="justify-start" icon={<Activity strokeWidth={1.5} size={14} />} asChild>
              <a href={STATUS_URL} target="_blank" rel="noreferrer">
                Supabase status
              </a>
            </Button>
          )
        }
        if (id === 'support') {
          return (
            <SupportLink key={id} queryParams={supportLinkQueryParams} onClick={onSupportClick}>
              <Button type="default" size={size}>
                Contact support
              </Button>
            </SupportLink>
          )
        }
        return null
      })}
    </div>
  )
}
