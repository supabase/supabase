import React from 'react'
import useConfData from '~/components/LaunchWeek/Ticket//hooks/use-conf-data'

function calculateWinChances(
  sharedOnLinkedIn: string | undefined,
  sharedOnTwitter: string | undefined
) {
  let numChances = 1

  let chancesText = 'chances'

  if (sharedOnLinkedIn) {
    numChances++
  }
  if (sharedOnTwitter) {
    numChances++
  }

  if (numChances === 1) {
    chancesText = 'chance'
  }

  return `${numChances}x ${chancesText}`
}

export default function ReferralIndicator() {
  const { userData } = useConfData()
  const { sharedOnLinkedIn, sharedOnTwitter } = userData
  const computedWinningOdds = calculateWinChances(sharedOnLinkedIn, sharedOnTwitter)

  return (
    <div className="bg-[#EAEAEA75] rounded-full mt-4 flex">
      <span className="bg-gradient-to-l from-[#A141E4] to-[#6300F569] rounded-full pl-4 pr-6 py-1.5 text-xs">
        {computedWinningOdds}
      </span>
    </div>
  )
}
