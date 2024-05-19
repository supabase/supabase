import { cn } from 'ui/src/lib/utils/cn'
// import { Card } from '@ui/components/shadcn/ui/card'
import color from 'ui/src/lib/tailwind-demo-classes'

export const Colors = () => {
  return (
    <div className="flex flex-col gap-12 py-20">
      <div className="flex flex-row gap-12">
        <div>
          <h5 className="mb-3">Background</h5>
          <div className="flex flex-col gap-3">
            {color.background.map((x: string, i) => {
              return (
                <div className="flex gap-3 items-center" key={i}>
                  <div className={cn(x, 'relative w-12 h-12 border border-overlay shadow')}></div>
                  <div className="font-mono text-sm bg-surface-100 px-2 py-0.5 rounded-full">
                    {x}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h5 className="mb-3">Border</h5>
          <div className="flex flex-col gap-3">
            {color.border.map((x, i) => {
              return (
                <div className="flex gap-3 items-center" key={i}>
                  <div className={cn(x, 'relative w-12 h-12 border-4')}></div>
                  <div className="font-mono text-sm bg-surface-100 px-2 py-0.5 rounded-full">
                    {x}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h5 className="mb-3">texts</h5>
          <div className="flex flex-col gap-3">
            {color.text.map((x, i) => {
              return (
                <div className="flex gap-3 items-center" key={i}>
                  <span className={cn(x, 'relative w-12 h-12 flex items-center justify-center')}>
                    ###
                  </span>
                  <div className="font-mono text-sm bg-surface-100 px-2 py-0.5 rounded-full">
                    {x}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-12">
        <div>
          <h5 className="mb-3">Colors</h5>
          <div className="flex flex-col gap-3">
            {color.colors.map((x: string, i) => {
              return (
                <div className="flex gap-3 items-center" key={i}>
                  <div className={cn(x, 'relative w-12 h-12 border border-overlay shadow')}></div>
                  <div className="font-mono text-sm bg-surface-100 px-2 py-0.5 rounded-full">
                    {x}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h5 className="mb-3">Palletes</h5>
          <div className="flex flex-col gap-3">
            {color.palletes.map((x, i) => {
              return (
                <div className="flex gap-3 items-center" key={i}>
                  <div className={cn(x, 'relative w-12 h-12 border border-overlay shadow')}></div>
                  <div className="font-mono text-sm bg-surface-100 px-2 py-0.5 rounded-full">
                    {x}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Colors
