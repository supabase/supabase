import * as React from 'react'

export const Width: React.FC<{
  children: React.ReactNode
  className?: string
  width?: number | string
}> = ({ children, className, width }) => {
  return (
    <div className={className} style={{ maxWidth: width ? `${width}%` : undefined }}>
      {children}
    </div>
  )
}
