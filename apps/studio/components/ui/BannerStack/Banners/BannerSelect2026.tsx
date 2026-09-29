import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import {
  SELECT_26_CTA,
  SELECT_26_DESCRIPTION,
  SELECT_26_LIVESTREAM_CTA,
  SELECT_26_LIVESTREAM_DESCRIPTION,
  SELECT_26_LIVESTREAM_STUDIO_DISMISSAL_KEY,
  SELECT_26_LIVESTREAM_MESSAGE,
  SELECT_26_STUDIO_DISMISSAL_KEY,
  SELECT_26_TITLE,
  SELECT_26_URL,
  Select26Field,
  useSelect26PromotionPhase,
} from 'ui-patterns/Banners/Select26Promotion'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const BannerSelect2026 = () => {
  const phase = useSelect26PromotionPhase()
  const { dismissBanner } = useBannerStack()
  const [, setIsWaitlistDismissed] = useLocalStorageQuery(SELECT_26_STUDIO_DISMISSAL_KEY, false)
  const [, setIsLivestreamDismissed] = useLocalStorageQuery(
    SELECT_26_LIVESTREAM_STUDIO_DISMISSAL_KEY,
    false
  )

  const dismiss = () => {
    if (phase === 'livestream') setIsLivestreamDismissed(true)
    else setIsWaitlistDismissed(true)
    dismissBanner(BANNER_ID.SELECT_26)
  }

  if (phase === 'ended') return null

  return (
    <BannerCard
      onDismiss={dismiss}
      className="w-72 border-[#00482f]/15 bg-[#f8f3ef] text-[#001a10] dark:border-white/10 dark:bg-[#0b0e0d] dark:text-[#f8f3ef]"
      background={
        <>
          {/* Wider than the card so overflow-hidden clips left/right flush to the edges */}
          <Select26Field
            cols={36}
            rows={8}
            className="absolute left-1/2 top-0 z-0 -translate-x-1/2 -translate-y-[32%] text-xl opacity-90 dark:opacity-80"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-b from-transparent from-[6%] via-[#f8f3ef]/85 via-[36%] to-[#f8f3ef] to-[48%] dark:via-[#0b0e0d]/85 dark:to-[#0b0e0d]" />
        </>
      }
    >
      <div className="flex flex-col gap-y-2">
        {/* Forehead spacer so the field reads above the copy */}
        <div className="h-10" aria-hidden />
        <div className="relative z-[2] flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium text-balance">
            {phase === 'livestream' ? SELECT_26_LIVESTREAM_MESSAGE : SELECT_26_TITLE}
          </p>
          <p className="text-xs text-foreground-lighter text-balance dark:text-[#f8f3ef]/65">
            {phase === 'livestream' ? SELECT_26_LIVESTREAM_DESCRIPTION : SELECT_26_DESCRIPTION}
          </p>
        </div>
        <Button
          asChild
          size="tiny"
          className="relative z-[2] w-min"
          iconRight={<ArrowUpRight size={14} strokeWidth={1.5} />}
        >
          <Link href={SELECT_26_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
            {phase === 'livestream' ? SELECT_26_LIVESTREAM_CTA : SELECT_26_CTA}
          </Link>
        </Button>
      </div>
    </BannerCard>
  )
}
