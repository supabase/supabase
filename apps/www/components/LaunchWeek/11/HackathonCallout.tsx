import React from 'react'
import { TextLink, cn } from 'ui'

const HackathonCallout = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'font-mono uppercase tracking-[1px] py-8 scroll-mt-16 flex flex-col md:flex-row justify-between gap-2',
        className
      )}
    >
      <div className="!text-foreground [&_*]:text-foreground text-sm flex flex-col sm:flex-row sm:items-center sm:gap-3">
        Open Source Hackathon 2024
      </div>
      <div className="!m-0 flex items-center">
        <TextLink
          label="Learn more"
          url="/blog/supabase-oss-hackathon"
          target="_blank"
          hasChevron
          className="m-0"
        />
      </div>
    </div>
  )
}

export default HackathonCallout
