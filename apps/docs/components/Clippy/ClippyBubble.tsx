import { FC } from 'react'
import { IconCommand } from '~/../../packages/ui'

interface Props {
  className?: string
  onClick?: () => void
}

const ClippyBubble: FC<Props> = ({ className, onClick }) => {
  return (
    <div
      className={`flex gap-2 bg-black rounded-xl p-6 max-w-xs shadow-2xl cursor-pointer ${className}`}
      onClick={onClick}
    >
      What can I help you with?
      <div className="flex items-center space-x-1">
        <div className="text-scale-1200 md:flex items-center justify-center h-5 w-10 border rounded bg-scale-500 border-scale-700 gap-1">
          <IconCommand size={12} strokeWidth={1.5} />
          <span className="text-[12px]">J</span>
        </div>
      </div>
      <svg className="absolute -bottom-4 right-3" viewBox="0 0 1 1" width={16} fill="black">
        <path d="M0,0 L1,0 L1,1 Z" />
      </svg>
    </div>
  )
}

export default ClippyBubble
