import { cn } from 'ui'

import type { GoFeatureGridSection } from '../schemas'

export default function FeatureGridSection({ section }: { section: GoFeatureGridSection }) {
  const { items, columns = 3 } = section
  const hasSecondRow = items.length > columns

  return (
    <div className="max-w-[80rem] mx-auto px-8">
      {(section.title || section.description) && (
        <div className="mb-12">
          {section.title && (
            <h2 className="text-2xl sm:text-3xl font-medium text-foreground">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-foreground-lighter mt-3 text-lg">{section.description}</p>
          )}
        </div>
      )}
      <div className="border border-muted rounded-xl overflow-hidden">
        <div
          className={cn(
            'grid grid-cols-1',
            columns === 1 ? 'md:grid-cols-1' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
          )}
        >
          {items.map((item, i) => {
            const col = i % columns
            const row = Math.floor(i / columns)
            const isLastCol = col === columns - 1 || i === items.length - 1
            const isLastRow = !hasSecondRow || row === Math.floor((items.length - 1) / columns)

            return (
              <div
                key={i}
                className={cn(
                  'p-6 sm:p-8',
                  !isLastCol && 'md:border-r border-muted',
                  !isLastRow && 'border-b border-muted',
                  // On mobile, all items except the last get a bottom border
                  i < items.length - 1 && 'max-md:border-b max-md:border-muted'
                )}
              >
                {item.icon && <span className="text-xl mb-3 block">{item.icon}</span>}
                <h3 className="text-foreground font-medium text-base">{item.title}</h3>
                <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
