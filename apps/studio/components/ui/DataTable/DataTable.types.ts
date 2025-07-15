// TODO: we could type the value(!) especially when using enums
export type Option = {
  label: string
  value: string | boolean | number | undefined
}

export type DatePreset = {
  label: string
  from: Date
  to: Date
  shortcut: string
}

export type Input = {
  type: 'input'
  options?: Option[]
}

export type Checkbox = {
  type: 'checkbox'
  component?: (props: Option) => JSX.Element | null
  options?: Option[]
}

export type Slider = {
  type: 'slider'
  min: number
  max: number
  // if options is undefined, we will provide all the steps between min and max
  options?: Option[]
}

export type DateRangeDisabled = { before?: Date; after?: Date }

export type Timerange = {
  type: 'timerange'
  options?: Option[] // required for TS
  presets?: DatePreset[]
  dateRangeDisabled?: DateRangeDisabled
}

export type Base<TData> = {
  label: string
  value: keyof TData
  /**
   * Defines if the accordion in the filter bar is open by default
   */
  defaultOpen?: boolean
  /**
   * Defines if the command input is disabled for this field
   */
  commandDisabled?: boolean
}

export type DataTableCheckboxFilterField<TData> = Base<TData> & Checkbox
export type DataTableSliderFilterField<TData> = Base<TData> & Slider
export type DataTableInputFilterField<TData> = Base<TData> & Input
export type DataTableTimerangeFilterField<TData> = Base<TData> & Timerange

export type DataTableFilterField<TData> =
  | DataTableCheckboxFilterField<TData>
  | DataTableSliderFilterField<TData>
  | DataTableInputFilterField<TData>
  | DataTableTimerangeFilterField<TData>
