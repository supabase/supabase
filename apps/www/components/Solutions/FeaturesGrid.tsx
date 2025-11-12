import styles from './features-grid.module.css'
import React from 'react'
import { cn } from 'ui'
import Panel from '~/components/Panel'
import SectionContainer from '../Layouts/SectionContainer'

export default function FeaturesGrid(props: any) {
  return (
    <SectionContainer className="flex flex-col gap-4 xl:pt-20">
      <div className="flex flex-col gap-2 max-w-xl">
        <h2 className="h2 text-foreground-lighter !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter max-w-md">{props.subheading}</p>
      </div>
      <div
        className={cn(
          'h-auto flex flex-col md:grid grid-cols-2 xl:grid-cols-3 gap-5 xl:flex-row',
          styles['features-grid']
        )}
      >
        <Content
          card={props.features.find((f: any) => f.id === 'mgmt-api')}
          innerClassName="
            xl:flex-row
            [&_.image-container]:border-b
            [&_.image-container]:pb-0
            [&_.image-container]:xl:border-none
            [&_.image-container]:xl:items-end
            [&_.image-container]:xl:order-last
            [&_.image-container]:xl:w-[calc(50%+1rem)]
            [&_.next-image--dynamic-fill]:rounded-none"
        />
        <Content
          card={props.features.find((f: any) => f.id === 'postgres')}
          innerClassName="[&_.image-container]:xl:pt-4 [&_.image-container]:xl:pl-8"
        />
        <Content card={props.features.find((f: any) => f.id === 'branching')} />
        <Content card={props.features.find((f: any) => f.id === 'pricing')} />
      </div>
    </SectionContainer>
  )
}

const Content = ({ card, innerClassName }: { card: any; innerClassName?: string }) => {
  return (
    <Panel
      key={card?.heading}
      hasActiveOnHover={false}
      outerClassName="w-full group hover:shadow-none"
      innerClassName={cn('relative flex flex-col justify-between xl:min-h-[250px]', innerClassName)}
      style={{ gridArea: card?.id }}
    >
      {card?.img && (
        <div className="image-container relative h-full w-full inline-flex items-start p-6">
          {card.img}
        </div>
      )}
      <div className="content-container flex flex-col justify-between gap-3 p-6 flex-1">
        <h3 className="text-foreground-lighter flex items-center gap-2">{card?.heading}</h3>
        <div className="flex flex-col justify-between gap-2">
          <p className="text-sm text-foreground-lighter">{card?.subheading}</p>
        </div>
      </div>
    </Panel>
  )
}
