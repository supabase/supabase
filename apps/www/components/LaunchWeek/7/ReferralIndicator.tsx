import React from 'react'
import useWinningChances from '../hooks/useWinningChances'

export default function ReferralIndicator() {
  const winningChances = useWinningChances()

  return (
    <div className="bg-[#EAEAEA75] rounded-full mt-4 flex w-full">
      <div
        className={[
          'bg-gradient-to-l from-[#A141E4] w-1/3 to-[#6300F569] flex items-center rounded-full pl-4 pr-6 py-1.5 text-xs shadow-[inset_0_0_2px_#ffffff50,0_0_1px_#00000050]',
          winningChances === 2 && 'w-2/3',
          winningChances === 3 && '!w-full bg-gradient-to-l from-[#E4B641] to-[#F5BF0069]',
        ].join(' ')}
      >
        <span style={{ textShadow: '0 0 4px #00000050' }}>{winningChances}x chance</span>
      </div>
    </div>
  )
}
