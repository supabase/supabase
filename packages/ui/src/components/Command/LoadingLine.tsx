import React from 'react'
import { cn } from '../../utils/cn'

export const LoadingLine = ({ loading }: { loading: boolean }) => {
  return (
    <div className="loading-line relative overflow-hidden w-full h-px bg-[#2e2e2e] m-auto">
      <span
        className={cn(
          'absolute w-[80px] h-px ml-auto mr-auto left-0 right-0 text-center block top-0',
          'loading-line--sprite transition-all',
          loading && 'loading-line--animate opacity-100',
          loading ? 'opacity-100' : 'opacity-0'
        )}
      ></span>
    </div>
  )
}
