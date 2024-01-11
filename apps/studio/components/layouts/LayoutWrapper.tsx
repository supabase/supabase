import { useIsNoticeBannerShown } from 'components/interfaces/App/AppBannerWrapperContext'
import { useFlag } from 'hooks'
import { PropsWithChildren } from 'react'

interface LayoutWrapperProps {
  id?: string
  className?: string
}

export const LayoutWrapper = ({
  id,
  className,
  children,
}: PropsWithChildren<LayoutWrapperProps>) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const showNoticeBanner = useFlag('showNoticeBanner')

  const noticeAcknowledged = useIsNoticeBannerShown()

  const numBanners = [ongoingIncident, showNoticeBanner && !noticeAcknowledged].filter(
    Boolean
  ).length
  const maxHeight = `calc(100vh - ${numBanners * 44}px)`

  return (
    <div id={id} className={className} style={{ height: maxHeight, maxHeight }}>
      {children}
    </div>
  )
}
