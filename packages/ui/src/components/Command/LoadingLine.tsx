import React from 'react'
import { cn } from '../../utils/cn'

export const LoadingLine = ({ loading }: { loading: boolean }) => {
  return (
    <div className="loading-line">
      <span
        className={cn(
          'loading-line--sprite transition-all',
          loading && 'loading-line--stripe--animate opacity-100',
          loading ? 'opacity-100' : 'opacity-0'
        )}
      ></span>
    </div>
  )
}
