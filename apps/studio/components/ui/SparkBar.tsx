import { cn } from 'ui'

interface SparkBarProps {
  value: number
  max?: number
  type?: 'horizontal' | 'vertical'
  labelTop?: string
  labelTopClass?: string
  labelBottom?: string
  labelBottomClass?: string
  barClass?: string
  bgClass?: string
  borderClass?: string
}

export const SparkBar = ({
  max = 100,
  value = 0,
  barClass = 'bg-foreground',
  bgClass = '',
  type = 'vertical',
  borderClass = '',
  labelBottom = '',
  labelBottomClass = 'tabular-nums',
  labelTop = '',
  labelTopClass = '',
}: SparkBarProps) => {
  if (type === 'horizontal') {
    const width = Number((value / max) * 100)
    const widthCss = `${width}%`
    const hasLabels = labelBottom || labelTop

    return (
      <div className="flex flex-col w-full">
        {hasLabels && (
          <div className="flex align-baseline justify-between pb-1 space-x-8">
            <p
              className={cn(
                'text-foreground text-sm truncate capitalize-sentence',
                labelTop.length > 0 && 'max-w-[75%]',
                labelBottomClass
              )}
            >
              {labelBottom}
            </p>
            <p className={cn('text-foreground-light text-sm', labelTopClass)}>{labelTop}</p>
          </div>
        )}
        <div
          className={`relative rounded h-1 overflow-hidden w-full border p-0 ${
            bgClass ? bgClass : 'bg-surface-400'
          } ${borderClass ? borderClass : 'border-none'}`}
        >
          <div
            className={`absolute rounded inset-x-0 bottom-0 h-1 ${barClass} transition-all`}
            style={{ width: widthCss }}
          ></div>
        </div>
      </div>
    )
  } else {
    const totalHeight = 35
    let height = Number((value / max) * totalHeight)
    if (height < 2) height = 2

    return (
      <div
        className={`relative rounded w-5 overflow-hidden border p-1 ${
          bgClass ? bgClass : 'bg-gray-400'
        } ${borderClass ? borderClass : 'border-none'}`}
        style={{ height: totalHeight }}
      >
        <div className={`absolute inset-x-0 bottom-0 w-5 ${barClass}`} style={{ height }}></div>
      </div>
    )
  }
}

export default SparkBar
