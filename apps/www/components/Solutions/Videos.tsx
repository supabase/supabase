import React, { FC } from 'react'

import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '../Panel'
import type { Testimonials } from '~/data/solutions/solutions.utils'

export type Story = {
  url: string
  heading: string
  subheading: string | JSX.Element
}

const EnterpriseSecurity: FC<Testimonials> = (props) => {
  return (
    <SectionContainer id={props.id} className="flex flex-col gap-4 xl:pt-20">
      <div className="flex flex-col gap-2 max-w-xl">
        <h2 className="h2 text-foreground-lighter !m-0">{props.heading}</h2>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit mt-4">
        <Panel innerClassName="p-2">
          <div className="video-container !rounded-md">
            <iframe
              className="w-full"
              src="https://www.youtube-nocookie.com/embed/9GQtXXERnqU"
              title="Supabase + Lovable"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </Panel>
        <Panel innerClassName="p-2">
          <div className="video-container !rounded-md">
            <iframe
              className="w-full"
              src="https://www.youtube-nocookie.com/embed/LfAV5fmRybg"
              title="Supabase + Bolt"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </Panel>
      </ul>
    </SectionContainer>
  )
}

export default EnterpriseSecurity
