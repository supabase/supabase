import { cn } from 'ui'

import type { GoStepsSection } from '../schemas'

export default function StepsSection({ section }: { section: GoStepsSection }) {
  return (
    <div className="max-w-7xl w-full min-w-0 mx-auto px-8">
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
      <div className="relative">
        {section.items.map((item, i) => {
          const isLast = i === section.items.length - 1
          return (
            <div key={i} className="flex gap-4 sm:gap-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-9 h-9 rounded-full border border-muted bg-surface-100 text-foreground text-sm font-medium shrink-0">
                  {item.icon ?? i + 1}
                </div>
                {!isLast && <div className="w-px flex-1 bg-muted my-2" />}
              </div>
              <div
                className={cn(
                  isLast ? 'flex-1 min-w-0 pb-0' : 'flex-1 min-w-0 pb-8',
                  '-translate-y-1'
                )}
              >
                <h3 className="text-foreground font-medium text-base mt-2">{item.title}</h3>
                {item.content ? (
                  <div className="mt-2">{item.content}</div>
                ) : item.description ? (
                  <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
