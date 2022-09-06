import { FC } from 'react'

interface Props {
  value: number
  max?: number
  type?: string
  labelTop?: string
  labelBottom?: string
  barClass?: string
  bgClass?: string
  borderClass?: string
}

const SparkBar: FC<Props> = ({
  max = 100,
  value = 0,
  barClass = '',
  bgClass = '',
  type = '',
  borderClass = '',
  labelBottom = '',
  labelTop = '',
}) => {
  if (type === 'horizontal') {
    const width = Number((value / max) * 100)
    const widthCss = `${width}%`
    const hasLabels = labelBottom || labelTop

    return (
      <div className="flex flex-col w-full">
        {hasLabels && (
          <div className="flex align-baseline justify-between pb-1 space-x-8">
            <span className="text-scale-1200 text-sm truncate">{labelBottom}</span>
            <span className="text-scale-1100 text-sm tabular-nums">{labelTop}</span>
          </div>
        )}
        <div
          className={`relative rounded h-1 overflow-hidden w-full border p-0 ${
            bgClass ? bgClass : 'bg-gray-100 dark:bg-gray-600'
          } ${borderClass ? borderClass : 'border-none'}`}
        >
          <div
            className={`absolute rounded inset-x-0 bottom-0 h-1 ${barClass}`}
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
