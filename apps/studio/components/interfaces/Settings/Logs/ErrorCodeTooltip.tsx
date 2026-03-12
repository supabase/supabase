import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { ExternalLink } from 'lucide-react'

import { useErrorCodesQuery } from 'data/content-api/docs-error-codes-query'
import { Service } from 'data/graphql/graphql'
import { BASE_PATH } from 'lib/constants'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  cn,
  DropdownMenuItem,
  DropdownMenuSeparator,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  InfoIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const SERVICE_DOCS_URLS: Partial<Record<Service, string>> = {
  [Service.Auth]: 'https://supabase.com/docs/guides/auth/debugging/error-codes',
}

interface ErrorCodeTooltipProps {
  errorCode: string
  service?: Service
  children: React.ReactNode
}

export const ErrorCodeTooltip = ({ errorCode, service, children }: ErrorCodeTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { data, isPending } = useErrorCodesQuery({ code: errorCode, service }, { enabled: isOpen })

  const errors = data?.errors?.nodes?.filter((e) => !!e.message) ?? []

  const docsUrl =
    errors.map((e) => SERVICE_DOCS_URLS[e.service]).find(Boolean) ??
    (service ? SERVICE_DOCS_URLS[service] : undefined)

  const buildPrompt = () => {
    const description = errors[0]?.message
    const servicePart = service ? ` in Supabase ${service}` : ''
    const descriptionPart = description ? `\n\nError description: ${description}` : ''
    return `I'm encountering error code \`${errorCode}\`${servicePart}.${descriptionPart}\n\nCan you explain what this error means and suggest steps to fix it?`
  }

  const handleOpenAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({
      name: `Fix error ${errorCode}`,
      initialMessage: buildPrompt(),
    })
  }

  return (
    <HoverCard_Shadcn_ open={isOpen} onOpenChange={setIsOpen} openDelay={200} closeDelay={100}>
      <HoverCardTrigger_Shadcn_ asChild>
        <span className="inline-flex items-center gap-1 cursor-default">
          {children}
          <InfoIcon hideBackground className="w-3.5 h-3.5 shrink-0 fill-foreground-muted" />
        </span>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ side="top" align="center" className="w-[360px] p-0 overflow-hidden">
        <div className="flex flex-col">
          <div className="px-4 pt-3 pb-2.5 border-b border-border">
            <p className="font-mono text-xs uppercase text-foreground-light truncate max-w-[40ch]">
              {errorCode}
            </p>
          </div>

          <div className="px-4 py-3 space-y-2">
            {isPending ? (
              <div className="space-y-1.5">
                <ShimmeringLoader className="w-full" />
                <ShimmeringLoader className="w-4/5" />
                <ShimmeringLoader className="w-3/5" />
              </div>
            ) : errors.length === 0 ? (
              <p className="text-sm text-foreground-lighter">
                No description available for this error code.
              </p>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{errors[0].message}</p>
            )}
          </div>

          <div
            className={cn(
              'border-t border-border px-4 py-2.5 flex items-center',
              docsUrl ? 'justify-between' : 'justify-end'
            )}
          >
            {docsUrl && (
              <div className="flex items-center gap-1.5">
                <Image
                  src={
                    resolvedTheme?.includes('dark')
                      ? `${BASE_PATH}/img/supabase-dark.svg`
                      : `${BASE_PATH}/img/supabase-light.svg`
                  }
                  alt="Supabase"
                  height={14}
                  width={72}
                />
                <span className="font-mono text-[11px] font-semibold text-brand tracking-wide">
                  DOCS
                </span>
              </div>
            )}
            <AiAssistantDropdown
              label="Fix with AI"
              buildPrompt={buildPrompt}
              onOpenAssistant={handleOpenAssistant}
              telemetrySource="error_code"
              copyLabel="Copy Markdown"
              showExternalAI
              extraDropdownItems={
                docsUrl ? (
                  <>
                    <DropdownMenuItem asChild className="gap-2">
                      <Link href={docsUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} />
                        Go to Docs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : undefined
              }
            />
          </div>
        </div>
      </HoverCardContent_Shadcn_>
    </HoverCard_Shadcn_>
  )
}
