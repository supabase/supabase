import Link from 'next/link'
import { Button } from 'ui'
import {
  SELECT_26_STUDIO_DISMISSAL_KEY,
  SELECT_26_URL,
  Select26Artwork,
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
        <Select26Artwork className="absolute -right-10 top-3 z-0 rotate-3 text-3xl opacity-[0.13] dark:opacity-[0.1]" />
      }
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Supabase Select 2026</p>
          <p className="max-w-52 text-xs text-foreground-lighter text-balance dark:text-[#f8f3ef]/65">
            is coming October 2.
          </p>
        </div>
        <Button asChild variant="default" size="tiny" className="w-min">
          <Link href={SELECT_26_URL} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
            Apply to attend
          </Link>
        </Button>
      </div>
    </BannerCard>
  )
}
