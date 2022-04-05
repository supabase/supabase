import React from 'react'

const LoadingOpacity = ({ children, active }: { children?: React.ReactNode; active: boolean }) => {
  return (
    <div
      className={
        'flex h-full flex-grow transition-opacity ' + (active ? 'opacity-30' : 'opacity-100')
      }
    >
      {children}
    </div>
  )
}

export default LoadingOpacity
