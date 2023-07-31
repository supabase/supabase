import React from 'react'
import { StyledArticleBadge } from './Releases/components'

const LWArchive = () => {
  return (
    <div>
      <div className="text-center relative z-10 text-white">
        <div className="max-w-[38rem] mx-auto flex flex-col items-center gap-4 px-4">
          <StyledArticleBadge>Throwback</StyledArticleBadge>
          <h2 className="text-4xl">Previous Launch Weeks</h2>
          <p className="text-[#9296AA]">
            Explore what has been announced in the past and relive those moments.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LWArchive
