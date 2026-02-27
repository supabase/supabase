import { IS_PLATFORM } from 'common'
import type { SupportFormUrlKeys } from 'components/interfaces/Support/SupportForm.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button, cn, Separator } from 'ui'
import styleHandler from 'ui/src/lib/theme/styleHandler'

import { ASSISTANT_SUGGESTIONS } from './HelpPanel.constants'
import { HelpSection } from './HelpSection'

export const HelpPanel = ({
  onClose,
  projectRef,
  supportLinkQueryParams,
}: {
  onClose: () => void
  projectRef: string | undefined
  supportLinkQueryParams: Partial<SupportFormUrlKeys> | undefined
}) => {
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar, closeSidebar } = useSidebarManagerSnapshot()
  const router = useRouter()

  const __styles = styleHandler('popover')

  return (
    <div className="space-y-4">
      <div className="flex text-xs items-center justify-between pl-4 pr-3 h-[var(--header-height)] border-b">
        <span>Help & Support</span>
        <ButtonTooltip
          type="text"
          className="w-7 h-7"
          onClick={() => closeSidebar(SIDEBAR_KEYS.HELP_PANEL)}
          icon={<X strokeWidth={1.5} />}
          tooltip={{ content: { side: 'bottom', text: 'Close' } }}
        />
      </div>
      <HelpSection
        className="px-4"
        excludeIds={['discord']}
        isPlatform={IS_PLATFORM}
        projectRef={projectRef}
        supportLinkQueryParams={supportLinkQueryParams}
        onAssistantClick={() => {
          onClose()
          openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
          snap.newChat(ASSISTANT_SUGGESTIONS)
        }}
        onSupportClick={onClose}
      />
      <Separator className={cn(__styles.separator, 'my-4')} />
      <div className="flex flex-col gap-4">
        <div className="px-4 flex flex-col gap-0.5">
          <h5 className="text-foreground">Community support</h5>
          <p className="text-xs text-foreground-lighter text-balance">
            Our Discord community can help with code-related issues. Many questions are answered in
            minutes.
          </p>
        </div>
        <div className="px-4">
          <div
            className="relative space-y-2 overflow-hidden rounded px-4 py-4 pb-12 shadow-md"
            style={{ background: '#404EED' }}
          >
            <a
              href="https://discord.supabase.com"
              target="_blank"
              rel="noreferrer"
              className="group dark block cursor-pointer"
            >
              <Image
                className="absolute left-0 top-0 opacity-50 transition-opacity group-hover:opacity-40"
                src={`${router.basePath}/img/support/discord-bg-small.jpg`}
                layout="fill"
                objectFit="cover"
                alt="Discord illustration"
              />
              <Button
                type="secondary"
                size="tiny"
                icon={<SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />}
              >
                <span style={{ color: '#404EED' }}>Join us on Discord</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
