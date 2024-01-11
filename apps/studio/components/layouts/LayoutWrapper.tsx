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
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div id={id} className={className} style={{ height: maxHeight, maxHeight }}>
      {children}
    </div>
  )
}
