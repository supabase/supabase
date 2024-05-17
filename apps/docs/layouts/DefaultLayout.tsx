import { type FC, type PropsWithChildren } from 'react'

export const LayoutMainContent: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => <div className={['max-w-7xl px-5 mx-auto py-16', className].join(' ')}>{children}</div>
