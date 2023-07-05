import { Meta } from '@storybook/react'
import { cn } from './utils'
// import { Card } from '@ui/components/shadcn/ui/card'
import color from './tailwind-demo-classes'

const meta: Meta = {
  title: 'tailwind/Colors',
}

export const Default = () => {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-row gap-12">
        <div>
          <h5 className="mb-3">Background</h5>
          <div className="flex flex-col gap-3">
            {color.background.map((x: string) => {
              return (
                <div className="flex gap-3 items-center">
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
            {color.border.map((x) => {
              return (
                <div className="flex gap-3 items-center">
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
            {color.text.map((x) => {
              return (
                <div className="flex gap-3 items-center">
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
            {color.colors.map((x: string) => {
              return (
                <div className="flex gap-3 items-center">
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
            {color.palletes.map((x) => {
              return (
                <div className="flex gap-3 items-center">
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

export default meta
