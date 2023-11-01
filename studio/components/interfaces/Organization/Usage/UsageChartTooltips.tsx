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
      <p className="text-xs text-foreground-light">{name}</p>
      {isAfterToday ? (
        <p className="text-foreground-light text-lg">No data yet</p>
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

const AttributeContent = ({
  attribute,
  attributeMeta,
  sumValue,
  tooltipFormatter,
}: {
  attribute: Attribute
  attributeMeta?: Payload<ValueType, string | number>
  sumValue: number
  tooltipFormatter?: (value: any) => any
}) => {
  const attrValue = Number(attributeMeta?.value ?? 0)
  const percentageContribution = ((attrValue / sumValue) * 100).toFixed(1)

  return (
    <div key={attribute.name} className="flex items-center justify-between">
      <div className="flex items-center space-x-2 w-[200px]">
        <div className={clsx('w-3 h-3 rounded-full border', COLOR_MAP[attribute.color].marker)} />
        <p className="text-xs prose">
          {attribute.name} ({percentageContribution}%):{' '}
        </p>
      </div>
      <p className="text-xs tabular-nums">
        {tooltipFormatter !== undefined ? tooltipFormatter(attrValue) : attrValue}
      </p>
    </div>
  )
}

export const MultiAttributeTooltipContent = ({
  attributes,
  values,
  isAfterToday,
  tooltipFormatter,
}: MultiAttributeTooltipContentProps) => {
  const sumValue = values.reduce((a, b) => a + Number(b.value), 0)
  return (
    <>
      {isAfterToday ? (
        <p className="text-foreground-light text-lg">No data yet</p>
      ) : (
        <div className="space-y-1 pb-1">
          {attributes.flatMap((attr) => {
            const attributeMeta = values.find((x) => x.dataKey === attr.key)

            // Filter out empty attributes
            if (Number(attributeMeta?.value ?? 0) === 0) return []

            return (
              <AttributeContent
                key={attr.name}
                attribute={attr}
                attributeMeta={attributeMeta}
                sumValue={sumValue}
                tooltipFormatter={tooltipFormatter}
              />
            )
          })}
        </div>
      )}
    </>
  )
}
