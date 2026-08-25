import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import {
  SELECT_26_CTA,
  SELECT_26_DESCRIPTION,
  SELECT_26_STUDIO_DISMISSAL_KEY,
  SELECT_26_TITLE,
  SELECT_26_URL,
  Select26Field,
} from 'ui-patterns/Banners/Select26Promotion'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const BannerSelect2026 = () => {
  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(SELECT_26_STUDIO_DISMISSAL_KEY, false)

  const dismiss = () => {
    setIsDismissed(true)
    dismissBanner(BANNER_ID.SELECT_26)
  }

  return (
    <BannerCard
      onDismiss={dismiss}
      className="w-72 border-[#00482f]/15 bg-[#f8f3ef] text-[#001a10] dark:border-white/10 dark:bg-[#0b0e0d] dark:text-[#f8f3ef]"
      background={
        <>
          <Select26Field
            cols={14}
            rows={6}
            className="absolute left-1/2 top-3 z-0 -translate-x-1/2 text-xl opacity-[0.14] dark:opacity-[0.11]"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-b from-transparent from-15% via-[#f8f3ef]/55 via-40% to-[#f8f3ef] to-65% dark:via-[#0b0e0d]/55 dark:to-[#0b0e0d]" />
        </>
      }
    >
      <div className="flex flex-col gap-y-2">
        {/* Forehead spacer so the arrow field reads above the copy, like badge rows on other cards */}
        <div className="h-10" aria-hidden />
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium text-balance">{SELECT_26_TITLE}</p>
          <p className="text-xs text-foreground-lighter text-balance dark:text-[#f8f3ef]/65">
            {SELECT_26_DESCRIPTION}
          </p>
        </div>
        <Button
          asChild
          variant="default"
          size="tiny"
          className="w-min"
          iconRight={<ArrowUpRight size={14} strokeWidth={1.5} />}
        >
          <Link href={SELECT_26_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
            {SELECT_26_CTA}
          </Link>
        </Button>
      </div>
    </BannerCard>
  )
}
