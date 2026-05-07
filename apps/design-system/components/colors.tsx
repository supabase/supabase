import { useState } from 'react'
import { cn } from 'ui'
import color from 'ui/src/lib/tailwind-demo-classes'

import { Grid, GridItem } from './grid'

const Colors = ({
  definition,
}: {
  definition: 'background' | 'border' | 'text' | 'colors' | 'palletes'
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedIndex(index)
      setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
  const Example = ({ x }: { x: string }) => {
    switch (definition) {
      case 'background':
        return (
          <div className={cn(x, 'relative w-full h-12 border border-overlay rounded-full')}></div>
        )
        break

      case 'border':
        return <div className={cn(x, 'relative w-full h-12 border-4 rounded-full')}></div>
        break

      case 'text':
        return (
          <span className={cn(x, 'relative w-full h-12 flex items-center justify-center')}>
            Postgres
          </span>
        )
        break

      case 'colors':
        return (
          <div className={cn(x, 'relative w-full h-12 border border-overlay rounded-full')}></div>
        )
        break

      case 'palletes':
        return (
          <div className={cn(x, 'relative w-full h-12 border border-overlay rounded-full')}></div>
        )
        break

      default:
        break
    }
  }

  return (
    <>
      <Grid>
        {color[definition].map((x: string, i) => {
          return (
            <GridItem
              key={i}
              className={cn(x.includes('contrast') && 'bg-foreground hover:bg-foreground-light')}
              onClick={() => handleCopy(x, i)}
            >
              <Example x={x} />
              <span className="bg-surface-100 rounded-full border px-2 font-mono text-xs text-foreground-lighter group-data-[state=open]:text-foreground text-center">
                {copiedIndex === i ? 'Copied!' : x}
              </span>
            </GridItem>
          )
        })}
      </Grid>
    </>
  )
}

export { Colors }
