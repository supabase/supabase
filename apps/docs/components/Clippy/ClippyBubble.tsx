import { FC } from 'react'
import { IconCommand } from 'ui'
import Image from 'next/image'
interface Props {
  className?: string
  onClick?: () => void
}

const ClippyBubble: FC<Props> = ({ className, onClick }) => {
  return (
    <div
      className={`flex gap-2 border bg-white dark:bg-scale-300 relative rounded-xl p-4 lg:p-6 max-w-sm lg:max-w-xs shadow-xl mb-1 lg:mb-4 cursor-pointer hover:bg-scale-200 transition-colors border-scale-500 hover:border-scale-700 overflow-hidden ${
        className ? className : ''
      }`}
      onClick={onClick}
    >
      <div className="z-0 absolute -left-24 -top-4 w-[260px]">
        <Image alt="Clippy blur" width={260} height={260} src="/docs/img/purple-glow-dark.png" />
      </div>
      What can I help you with?
      <div className="flex items-center space-x-1">
        <div className="text-scale-1200 flex items-center justify-center h-5 w-10 border rounded bg-scale-500 border-scale-700 gap-1">
          <IconCommand size={12} strokeWidth={1.5} />
          <span className="text-[12px]">/</span>
        </div>
      </div>
      <div className="absolute -bottom-4 right-[90px] text-scale-600">
        <svg viewBox="0 0 1 1" width={16} fill="currentColor">
          <path d="M0,0 L1,0 L1,1 Z" />
        </svg>
      </div>
    </div>
  )
}

export default ClippyBubble
