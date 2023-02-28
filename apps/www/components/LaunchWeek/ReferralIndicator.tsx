import React from 'react'

interface Props {
  referrals: number
}

export default function ReferralIndicator({ referrals }: Props) {
  let text

  switch (referrals) {
    case 0:
      text = '1x chance'
      break
    case 1:
      text = '2x chance'
      break
    case 2:
      text = '3x chance'
      break
    default:
      text = 'You have more than three referrals.'
  }
  return (
    <div className="bg-[#EAEAEA75] rounded-full mt-4 flex">
      <span className="bg-gradient-to-l from-[#A141E4] to-[#6300F569] rounded-full pl-4 pr-6 py-2 text-xs">
        {text}
      </span>
    </div>
  )
}
