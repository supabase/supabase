import React from 'react'
import useConfData from '~/components/LaunchWeek/Ticket//hooks/use-conf-data'
import useWinningChances from './Ticket/hooks/useWinningChances'

export default function ReferralIndicator() {
  const winningChances = useWinningChances()

  return (
    <div className="bg-[#EAEAEA75] rounded-full mt-4 flex w-full">
      <div
        className={[
          'bg-gradient-to-l from-[#A141E4] to-[#6300F569] rounded-full pl-4 pr-6 py-1.5 text-xs',
          winningChances === 2 ? 'w-1/2' : '',
          winningChances === 3 ? 'w-full bg-gradient-to-l from-[#E4B641] to-[#F5BF0069]' : '',
        ].join(' ')}
      >
        <span style={{ textShadow: '0 1px 1px rgba(0, 0, 0,0.5)' }}>{winningChances}x chance</span>
      </div>
    </div>
  )
}
