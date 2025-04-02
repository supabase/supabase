import styles from './features-grid.module.css'
import React from 'react'
import { cn } from 'ui'
import Panel from '~/components/Panel'
import SectionContainer from '../Layouts/SectionContainer'

export default function FeaturesGrid(props: any) {
  const mgmt = props.features['mgmt-api']
  console.log('mgmt', mgmt)

  return (
    <SectionContainer className="flex flex-col gap-4">
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
          card={props.features['mgmt-api']}
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
          card={props.features['postgres']}
          innerClassName="[&_.image-container]:xl:pt-4 [&_.image-container]:xl:pl-8"
        />
        <Content card={props.features['branching']} />
        <Content card={props.features['pricing']} />
      </div>
    </SectionContainer>
  )
}

const Content = ({
  card,
  outerClassName,
  innerClassName,
  cardClassName,
}: {
  card: any
  outerClassName?: string
  innerClassName?: string
  cardClassName?: string
}) => {
  const hasImg = !!card.image

  return (
    <Panel
      key={card.heading}
      hasActiveOnHover={false}
      outerClassName={cn('w-full group hover:shadow-none', outerClassName)}
      innerClassName={cn(
        'relative flex flex-col justify-between xl:min-h-[250px]',
        // hasImg && 'xl:flex-row xl:items-end',
        innerClassName
      )}
      style={{ gridArea: card.id }}
    >
      {card.img && (
        <div
          className={cn(
            'image-container relative h-full w-full inline-flex items-start p-6'
            // hasImg && 'xl:order-last flex-1 h-full'
          )}
        >
          {card.img}
        </div>
      )}
      <div
        className={cn(
          'content-container flex flex-col justify-between gap-3 p-6 flex-1'
          // hasImg && 'xl:w-2/5'
        )}
      >
        <h3 className="text-foreground-lighter flex items-center gap-2">{card.heading}</h3>
        <div className={cn('flex flex-col justify-between gap-2', hasImg && 'flex-auto')}>
          <p className="text-sm text-foreground-lighter">{card.subheading}</p>
        </div>
      </div>
    </Panel>
  )
}
