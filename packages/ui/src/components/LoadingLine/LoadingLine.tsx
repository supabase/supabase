import React from 'react'
import { cn } from '../../lib/utils'

export const LoadingLine = ({ loading }: { loading: boolean }) => {
  return (
    <div className="relative overflow-hidden w-full h-px bg-[#eceef0] dark:bg-[#2e2e2e] m-auto">
      <span
        className={cn(
          'absolute w-[80px] h-px ml-auto mr-auto left-0 right-0 text-center block top-0',
          'transition-all',
          'line-loading-bg-light dark:line-loading-bg',
          loading && 'animate-line-loading opacity-100',
          loading ? 'opacity-100' : 'opacity-0'
        )}
      ></span>
    </div>
  )
}
