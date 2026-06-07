import { PropsWithChildren } from 'react'

interface AlphaNoticeProps {
  entity: string
  feedbackUrl: string
  className?: string
}

// [console fork] Self-host: no "private alpha / share feedback" promo banners.
export const AlphaNotice = (_props: PropsWithChildren<AlphaNoticeProps>) => null
