import React from 'react'
import AnnouncementBadge from './Badge'

const WebinarAnnouncement = () => {
  return (
    <div className="z-40 w-full flex flex-col gap-4 items-center justify-center -mt-4 md:-mt-8 mb-8 lg:mb-8">
      <AnnouncementBadge
        url="/events/scale-to-billions-generative-ai-humata"
        badge={
          <>
            Webinar <span className="hidden sm:inline ml-1">/ Aug 21</span>
          </>
        }
        announcement={
          <>
            Scale to Billions: Generative AI
            <span className="hidden sm:inline">/Humata</span>
          </>
        }
      />
    </div>
  )
}

export default WebinarAnnouncement
