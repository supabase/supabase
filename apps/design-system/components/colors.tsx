import { useState } from 'react'
import { cn, colors } from 'ui'

import { Grid, GridItem } from './grid'

const color = colors['default']

const Colors = ({
  definition,
  classes,
}: {
  definition: 'background' | 'border' | 'text' | 'colors' | 'palletes'
  /** Optional subset of utility classes. Defaults to the full set for `definition`. */
  classes?: string[]
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const items = classes ?? color[definition]

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
        {items.map((x: string, i) => {
          return (
            <GridItem
              key={i}
              className={cn(x.includes('contrast') && 'bg-foreground hover:bg-foreground-light')}
              onClick={() => handleCopy(x, i)}
            >
              <Example x={x} />
              <span className="bg-surface-100 rounded-full border px-2 font-mono text-xs text-foreground-lighter group-data-open:text-foreground text-center">
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
