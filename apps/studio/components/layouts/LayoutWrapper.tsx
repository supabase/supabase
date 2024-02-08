import { useIsNoticeBannerShown } from 'components/interfaces/App/AppBannerWrapperContext'
import { useFlag } from 'hooks'
import { PropsWithChildren } from 'react'

interface LayoutWrapperProps {
  id?: string
  className?: string
}

// [Joshen] We can probably deprecate this now actually - not needed
export const LayoutWrapper = ({
  id,
  className,
  children,
}: PropsWithChildren<LayoutWrapperProps>) => {
  return (
    <div id={id} className={className}>
      {children}
    </div>
  )
}
