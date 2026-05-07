import { PropsWithChildren } from 'react'

const LoadingOpacity = ({
  children,
  active,
  className,
}: PropsWithChildren<{
  children?: React.ReactNode
  active: boolean
  className?: string
}>) => {
  return (
    <div
      className={[
        className,
        'flex h-full flex-grow transition-opacity ',
        active ? 'opacity-30' : 'opacity-100',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export default LoadingOpacity
