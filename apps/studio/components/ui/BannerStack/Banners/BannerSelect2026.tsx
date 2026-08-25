import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import {
  SELECT_26_CTA,
  SELECT_26_MESSAGE,
  SELECT_26_STUDIO_DISMISSAL_KEY,
  SELECT_26_URL,
  Select26Artwork,
  Select26Mark,
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
      className="border-[#00482f]/15 bg-[#f8f3ef] text-[#001a10] dark:border-white/10 dark:bg-[#0b0e0d] dark:text-[#f8f3ef]"
      background={
        <Select26Artwork className="absolute inset-0 z-0 text-[#00482f] opacity-60 dark:text-[#94e6b7] dark:opacity-30" />
      }
    >
      <div className="flex flex-col items-start gap-5">
        <Select26Mark className="w-36 text-[#00482f] dark:text-[#94e6b7]" />
        <p className="max-w-52 text-sm font-medium leading-5 text-balance">{SELECT_26_MESSAGE}</p>
        <Button
          asChild
          size="tiny"
          className="bg-[#00482f] text-[#f8f3ef] hover:bg-[#003825] dark:bg-[#94e6b7] dark:text-[#001a10] dark:hover:bg-[#b2efcb]"
        >
          <Link href={SELECT_26_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
            {SELECT_26_CTA}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </BannerCard>
  )
}
