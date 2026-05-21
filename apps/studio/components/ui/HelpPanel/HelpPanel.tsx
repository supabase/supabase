import { IS_PLATFORM } from 'common'
import { ChevronLeft, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SVG from 'react-inlinesvg'
import { Button } from 'ui'

import { ASSISTANT_SUGGESTIONS } from './HelpPanel.constants'
import { HelpSection } from './HelpSection'
import type { SupportFormUrlKeys } from '@/components/interfaces/Support/SupportForm.utils'
import {
  SupportForm,
  SupportFormStatusButton,
} from '@/components/interfaces/Support/SupportSidebarForm'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

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
  const [view, setView] = useState<'home' | 'support'>('home')
  const isSupportView = view === 'support'
  const openAssistant = () => {
    onClose()
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat(ASSISTANT_SUGGESTIONS)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-(--header-height) items-center justify-between gap-2 border-b pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          {isSupportView && (
            <ButtonTooltip
              type="text"
              className="h-7 w-7"
              onClick={() => setView('home')}
              icon={<ChevronLeft strokeWidth={1.5} />}
              tooltip={{ content: { side: 'bottom', text: 'Back' } }}
            />
          )}
          <span className="truncate">{isSupportView ? 'Contact support' : 'Help & Support'}</span>
        </div>
        <div className="flex items-center gap-2">
          <SupportFormStatusButton />
          <ButtonTooltip
            type="text"
            className="w-7 h-7"
            onClick={() => closeSidebar(SIDEBAR_KEYS.HELP_PANEL)}
            icon={<X strokeWidth={1.5} />}
            tooltip={{ content: { side: 'bottom', text: 'Close' } }}
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isSupportView ? (
          <SupportForm
            initialParams={supportLinkQueryParams}
            onFinish={() => {
              setView('home')
            }}
          />
        ) : (
          <div className="flex h-full flex-col overflow-y-auto pb-5">
            <HelpSection
              excludeIds={['discord']}
              isPlatform={IS_PLATFORM}
              projectRef={projectRef}
              supportLinkQueryParams={supportLinkQueryParams}
              onAssistantClick={openAssistant}
              onSupportClick={() => {
                setView('support')
                return false
              }}
            />
            <div className="flex flex-col gap-4 border-t pt-5">
              <div className="px-5 flex flex-col gap-0.5">
                <h5 className="text-foreground">Community support</h5>
                <p className="text-xs text-foreground-lighter text-balance">
                  Our Discord community can help with code-related issues. Many questions are
                  answered in minutes.
                </p>
              </div>
              <div className="px-5">
                <div
                  className="relative space-y-2 overflow-hidden rounded-sm px-4 py-4 pb-12 shadow-md"
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
                      icon={
                        <SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />
                      }
                    >
                      <span style={{ color: '#404EED' }}>Join us on Discord</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
