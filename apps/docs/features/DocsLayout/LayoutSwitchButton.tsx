'use client'

import { IA_NAV_FLAG, type IaNavVariant } from '~/features/IaNav/constants'
import { useDocsPathname, useIaNavRouteVariant } from '~/features/IaNav/IaNavRouteProvider'
import { setLayoutChoice } from '~/features/IaNav/layoutChoice'
import { useIaNavReady } from '~/features/IaNav/useIaNavReady'
import { useIaNavVariant } from '~/features/IaNav/useIaNavVariant'
import { BASE_PATH, IS_PLATFORM } from '~/lib/constants'
import { supabase } from '~/lib/supabase'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { PanelsTopLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button, cn } from 'ui'

import { LayoutSwitchFeedbackDialog } from './LayoutSwitchFeedbackDialog'

interface LayoutSwitchButtonProps {
  className?: string
}

export const LayoutSwitchButton = ({ className }: LayoutSwitchButtonProps) => {
  const variant = useIaNavVariant()
  const isNavReady = useIaNavReady()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const pathname = usePathname() ?? ''
  const routeVariant = useIaNavRouteVariant()
  const docsPathname = useDocsPathname()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const switchLayout = (nextVariant: IaNavVariant) => {
    setLayoutChoice(nextVariant)
    sendTelemetryEvent({
      action: 'docs_layout_updated',
      properties: { layoutVariant: nextVariant },
    })

    // a forced url or route keeps its variant over the choice, so only a load of the public page switches
    const url = new URL(window.location.href)
    const isForcedUrl = url.searchParams.has(IA_NAV_FLAG)
    if (!isForcedUrl && !routeVariant) return
    url.searchParams.delete(IA_NAV_FLAG)
    if (!isForcedUrl) url.pathname = `${BASE_PATH}${docsPathname}`
    window.location.replace(url)
  }

  // a switch back asks why first, so the rollout gets a reason for each opt-out
  const handleClick = () =>
    variant === 'option-1' ? setIsFeedbackOpen(true) : switchLayout('option-1')

  const handleFeedbackCancel = () => setIsFeedbackOpen(false)

  const handleFeedbackSubmit = async (comment: string) => {
    if (comment && IS_PLATFORM) {
      // the vote and title columns are for page feedback, so the source lives in metadata
      const { error } = await supabase()
        .from('feedback_comments')
        .insert({
          page: pathname,
          comment,
          metadata: { source: 'docs_layout_switch', layoutVariant: 'control' },
        })
      if (error) console.error(error)
    }
    setIsFeedbackOpen(false)
    switchLayout('control')
  }

  // the server renders control, so the button waits for the known variant
  if (!isNavReady) return null

  return (
    <>
      <Button
        ref={buttonRef}
        size="small"
        icon={<PanelsTopLeft className="size-4!" />}
        className={cn('justify-start self-stretch pl-1.5', className)}
        onClick={handleClick}
      >
        {variant === 'option-1' ? 'Switch to classic layout' : 'Switch to new layout'}
      </Button>
      <LayoutSwitchFeedbackDialog
        isOpen={isFeedbackOpen}
        returnFocusRef={buttonRef}
        onCancel={handleFeedbackCancel}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}
