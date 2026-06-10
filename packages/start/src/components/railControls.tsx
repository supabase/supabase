'use client'

/**
 * Presentational rail controls for the get-started configurator.
 * Uses FormLayout vertical (label above control) outside react-hook-form.
 */
import { type ReactNode } from 'react'
import { cn, RadioGroupStacked, RadioGroupStackedItem } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

const railFormLayoutDefaults = {
  size: 'small' as const,
  nonBoxInput: true,
}

export function RailFormField({
  label,
  labelOptional,
  description,
  layout = 'vertical',
  align,
  children,
  className,
}: {
  label: string
  labelOptional?: ReactNode
  description?: ReactNode
  layout?: 'vertical' | 'flex-row-reverse'
  align?: 'left' | 'right'
  children: ReactNode
  className?: string
}) {
  const isFlexRowReverse = layout === 'flex-row-reverse'

  return (
    <FormLayout
      {...railFormLayoutDefaults}
      layout={layout}
      align={align}
      label={label}
      labelOptional={labelOptional}
      description={description}
      className={cn(
        'mb-7',
        isFlexRowReverse &&
          'flex-row! flex-row-reverse! items-start! justify-between! gap-4 max-md:gap-4',
        className
      )}
    >
      {isFlexRowReverse ? (
        <div className="ml-auto flex shrink-0 justify-end">{children}</div>
      ) : (
        <div className="w-full min-w-0">{children}</div>
      )}
    </FormLayout>
  )
}

export interface RadioOption<T extends string> {
  id: T
  label: string
  meta?: string
}

export function RailRadioOptions<T extends string>({
  options,
  value,
  onChange,
  idPrefix = 'rail-radio',
}: {
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  idPrefix?: string
}) {
  return (
    <RadioGroupStacked value={value} onValueChange={(next) => onChange(next as T)}>
      {options.map((o) => (
        <RadioGroupStackedItem
          key={o.id}
          value={o.id}
          id={`${idPrefix}-${o.id}`}
          label={o.label}
          description={o.meta}
        />
      ))}
    </RadioGroupStacked>
  )
}

export function RailRadioField<T extends string>({
  label,
  labelOptional,
  description,
  options,
  value,
  onChange,
  idPrefix,
}: {
  label: string
  labelOptional?: ReactNode
  description?: ReactNode
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  idPrefix?: string
}) {
  return (
    <RailFormField label={label} labelOptional={labelOptional} description={description}>
      <RailRadioOptions
        options={options}
        value={value}
        onChange={onChange}
        idPrefix={idPrefix ?? label.toLowerCase().replace(/\s+/g, '-')}
      />
    </RailFormField>
  )
}
