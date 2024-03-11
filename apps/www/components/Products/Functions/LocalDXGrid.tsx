import styles from './local-dx-grid.module.css'
import React from 'react'
import { cn } from 'ui'
import { useBreakpoint } from 'common'
import page from '~/data/products/functions/page'
import Panel from '../../Panel'

export default function LocalDXGrid() {
  const isXs = useBreakpoint(640)
  const pageData = page(isXs)

  return (
    <div
      className={cn(
        'h-auto flex flex-col md:grid grid-cols-2 lg:grid-cols-3 gap-5 lg:flex-row',
        styles['local-dx-grid']
      )}
    >
      {pageData.localDXsection.cards.map((card) => (
        <Content card={card} />
      ))}
    </div>
  )
}

const Content = ({ card }: { card: any }) => {
  const isHoriz = card.id === 'ci'

  return (
    <Panel
      key={card.label}
      outerClassName="w-full"
      innerClassName={cn(
        'flex flex-col gap-4 min-h-[300px] lg:min-h-[300px]',
        isHoriz && 'flex-row items-end'
      )}
      style={{ gridArea: card.id }}
    >
      <div className={cn('flex-1 bg-default', isHoriz && 'order-last flex-1 h-full')}>
        {card.image}
      </div>
      <div className={cn('flex flex-col gap-1 p-4 md:p-6', isHoriz && 'lg:w-1/3')}>
        <h3 className="text-xl text-foreground">{card.label}</h3>
        <div className={cn('flex-1 flex flex-col justify-between gap-2', isHoriz && 'flex-auto')}>
          <p className="text-sm text-foreground-lighter">{card.paragraph}</p>
        </div>
      </div>
    </Panel>
  )
}
