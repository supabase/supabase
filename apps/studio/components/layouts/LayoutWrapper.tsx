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
  const numBanners = [ongoingIncident, showNoticeBanner].filter(Boolean).length
  const maxHeight = `calc(100vh - ${numBanners * 44}px)`

  return (
    <div id={id} className={className} style={{ height: maxHeight, maxHeight }}>
      {children}
    </div>
  )
}
