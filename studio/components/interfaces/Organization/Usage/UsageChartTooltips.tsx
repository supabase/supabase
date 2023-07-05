import clsx from 'clsx'
import { Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Attribute, COLOR_MAP } from './Usage.constants'

export interface SingleAttributeTooltipContentProps {
  name: string
  unit: 'bytes' | 'percentage' | 'absolute'
  value: any
  isAfterToday: boolean
  tooltipFormatter?: (value: any) => any
}

export const SingleAttributeTooltipContent = ({
  name,
  unit,
  value,
  isAfterToday,
  tooltipFormatter,
}: SingleAttributeTooltipContentProps) => {
  const formattedValue = unit === 'percentage' ? Number(value).toFixed(2) : Number(value)
  return (
    <>
      <p className="text-xs text-scale-1000">{name}</p>
      {isAfterToday ? (
        <p className="text-scale-1000 text-lg">No data yet</p>
      ) : (
        <p className="text-xl">
          {tooltipFormatter !== undefined ? tooltipFormatter(formattedValue) : formattedValue}
        </p>
      )}
    </>
  )
}

export interface MultiAttributeTooltipContentProps {
  attributes: Attribute[]
  values: Payload<ValueType, string | number>[]
  isAfterToday: boolean
  tooltipFormatter?: (value: any) => any
}

export const MultiAttributeTooltipContent = ({
  attributes,
  values,
  isAfterToday,
  tooltipFormatter,
}: MultiAttributeTooltipContentProps) => {
  return (
    <>
      {isAfterToday ? (
        <p className="text-scale-1000 text-lg">No data yet</p>
      ) : (
        <div className="space-y-1 pb-1">
          {attributes.map((attr) => {
            const attrMeta = values.find((x) => x.dataKey === attr.key)
            const attrValue = Number(attrMeta?.value ?? 0)
            const sumValue = values.reduce((a, b) => a + Number(b.value), 0)
            const percentageContribution = ((attrValue / sumValue) * 100).toFixed(1)

            return (
              <div key={attr.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 w-[200px]">
                  <div
                    className={clsx('w-3 h-3 rounded-full border', COLOR_MAP[attr.color].marker)}
                  />
                  <p className="text-sm prose">
                    {attr.name} ({percentageContribution}%):{' '}
                  </p>
                </div>
                <p className="text-sm tabular-nums">
                  {tooltipFormatter !== undefined ? tooltipFormatter(attrValue) : attrValue}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
