import React from 'react'

import announcement from '~/data/Announcement.json'

const Announcement = () => {
  if (!announcement.show) return null
  return (
    <a href={announcement.link} target="_blank">
      {/* <div className="bg-dark-700 text-white hover:bg-dark-600 dark:bg-white dark:text-dark-600 dark:hover:bg-dark-200 transition-colors"> */}
      <div className="bg-[#5865F2] text-white">
        <div className="flex items-center justify-center p-2 mx-auto space-x-2 text-sm lg:container lg:px-16 xl:px-20">
          {announcement.text}
        </div>
      </div>
    </a>
  )
}

export default Announcement
