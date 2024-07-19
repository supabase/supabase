import styles from './local-dx-grid.module.css'
import React from 'react'
import { cn } from 'ui'
import { useBreakpoint } from 'common'
import page from '~/data/products/functions/page'
import Panel from '~/components/Panel'

export default function LocalDXGrid() {
  const isXs = useBreakpoint(640)
  const pageData = page(isXs)

  return (
    <div
      className={cn(
        'h-auto flex flex-col md:grid grid-cols-2 xl:grid-cols-3 gap-5 xl:flex-row',
        styles['local-dx-grid']
      )}
    >
      {pageData.localDXsection.cards.map((card) => (
        <Content key={card.id} card={card} />
      ))}
    </div>
  )
}

const Content = ({ card }: { card: any }) => {
  const isHoriz = card.id === 'ci'

  return (
    <Panel
      key={card.label}
      outerClassName="w-full group"
      innerClassName={cn(
        'relative flex flex-col min-h-[300px] xl:min-h-[300px]',
        isHoriz && 'xl:flex-row xl:items-end'
      )}
      style={{ gridArea: card.id }}
    >
      <div
        className={cn(
          'relative flex-[1_1_0] h-full w-full inline-flex items-center',
          isHoriz && 'xl:order-last flex-1 h-full'
        )}
      >
        {card.image}
      </div>
      <div className={cn('flex flex-col gap-1 p-4 xl:p-6 xl:!pt-0', isHoriz && 'xl:w-2/5')}>
        <h3 className="text-foreground">{card.label}</h3>
        <div className={cn('flex-1 flex flex-col justify-between gap-2', isHoriz && 'flex-auto')}>
          <p className="text-sm text-foreground-lighter">{card.paragraph}</p>
        </div>
      </div>
    </Panel>
  )
}
