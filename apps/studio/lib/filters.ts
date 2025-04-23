import '@tanstack/table-core'
import type { AccessorFn, Column, Row, RowData } from '@tanstack/react-table'
import type { ColumnMeta, Table } from '@tanstack/react-table'
import { endOfDay, isAfter, isBefore, isSameDay, isWithinInterval, startOfDay } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { intersection, uniq } from './array'

export type ElementType<T> = T extends (infer U)[] ? U : T

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /* The display name of the column. */
    displayName: string

    /* The column icon. */
    icon: LucideIcon

    /* The data type of the column. */
    type: ColumnDataType

    /* An optional list of options for the column. */
    /* This is used for columns with type 'option' or 'multiOption'. */
    /* If the options are known ahead of time, they can be defined here. */
    /* Otherwise, they will be dynamically generated based on the data. */
    options?: ColumnOption[]

    /* An optional function to transform columns with type 'option' or 'multiOption'. */
    /* This is used to convert each raw option into a ColumnOption. */
    transformOptionFn?: (value: ElementType<NonNullable<TValue>>) => ColumnOption

    /* An optional "soft" max for the number range slider. */
    /* This is used for columns with type 'number'. */
    max?: number
  }
}

/* TODO: Allow both accessorFn and accessorKey */
export function defineMeta<
  TData,
  /* Only accessorFn - WORKS */
  TAccessor extends AccessorFn<TData>,
  TVal extends ReturnType<TAccessor>,
  /* Only accessorKey - WORKS */
  // TAccessor extends DeepKeys<TData>,
  // TVal extends DeepValue<TData, TAccessor>,

  /* Both accessorKey and accessorFn - BROKEN */
  /* ISSUE: Won't infer transformOptionFn input type correctly. */
  // TAccessor extends AccessorFn<TData> | DeepKeys<TData>,
  // TVal extends TAccessor extends AccessorFn<TData>
  // ? ReturnType<TAccessor>
  // : TAccessor extends DeepKeys<TData>
  // ? DeepValue<TData, TAccessor>
  // : never,
  TType extends ColumnDataType,
>(
  accessor: TAccessor,
  meta: Omit<ColumnMeta<TData, TVal>, 'type'> & {
    type: TType
  }
): ColumnMeta<TData, TVal> {
  return meta
}

/*
 * Represents a possible value for a column property of type 'option' or 'multiOption'.
 */
export interface ColumnOption {
  /* The label to display for the option. */
  label: string
  /* The internal value of the option. */
  value: string
  /* An optional icon to display next to the label. */
  icon?: React.ReactElement | React.ElementType
}

/*
 * Represents the data type of a column.
 */
export type ColumnDataType =
  /* The column value is a string that should be searchable. */
  | 'text'
  | 'number'
  | 'date'
  /* The column value can be a single value from a list of options. */
  | 'option'
  /* The column value can be zero or more values from a list of options. */
  | 'multiOption'

/* Operators for text data */
export type TextFilterOperator = 'contains' | 'does not contain'

/* Operators for number data */
export type NumberFilterOperator =
  | 'is'
  | 'is not'
  | 'is less than'
  | 'is greater than or equal to'
  | 'is greater than'
  | 'is less than or equal to'
  | 'is between'
  | 'is not between'

/* Operators for date data */
export type DateFilterOperator =
  | 'is'
  | 'is not'
  | 'is before'
  | 'is on or after'
  | 'is after'
  | 'is on or before'
  | 'is between'
  | 'is not between'

/* Operators for option data */
export type OptionFilterOperator = 'is' | 'is not' | 'is any of' | 'is none of'

/* Operators for multi-option data */
export type MultiOptionFilterOperator =
  | 'include'
  | 'exclude'
  | 'include any of'
  | 'include all of'
  | 'exclude if any of'
  | 'exclude if all'

/* Maps filter operators to their respective data types */
type FilterOperators = {
  text: TextFilterOperator
  number: NumberFilterOperator
  date: DateFilterOperator
  option: OptionFilterOperator
  multiOption: MultiOptionFilterOperator
}

/* Maps filter values to their respective data types */
export type FilterTypes = {
  text: string
  number: number
  date: Date
  option: string
  multiOption: string[]
}

/*
 *
 * FilterValue is a type that represents a filter value for a specific column.
 *
 * It consists of:
 * - Operator: The operator to be used for the filter.
 * - Values: An array of values to be used for the filter.
 *
 */
export type FilterModel<T extends ColumnDataType, TData> = {
  operator: FilterOperators[T]
  values: Array<FilterTypes[T]>
  columnMeta: Column<TData>['columnDef']['meta']
}

/*
 * FilterDetails is a type that represents the details of all the filter operators for a specific column data type.
 */
export type FilterDetails<T extends ColumnDataType> = {
  [key in FilterOperators[T]]: FilterOperatorDetails<key, T>
}

type FilterOperatorDetailsBase<OperatorValue, T extends ColumnDataType> = {
  /* The operator value. Usually the string representation of the operator. */
  value: OperatorValue
  /* The label for the operator, to show in the UI. */
  label: string
  /* How much data the operator applies to. */
  target: 'single' | 'multiple'
  /* The plural form of the operator, if applicable. */
  singularOf?: FilterOperators[T]
  /* The singular form of the operator, if applicable. */
  pluralOf?: FilterOperators[T]
  /* All related operators. Normally, all the operators which share the same target. */
  relativeOf: FilterOperators[T] | Array<FilterOperators[T]>
  /* Whether the operator is negated. */
  isNegated: boolean
  /* If the operator is not negated, this provides the negated equivalent. */
  negation?: FilterOperators[T]
  /* If the operator is negated, this provides the positive equivalent. */
  negationOf?: FilterOperators[T]
}

/*
 *
 * FilterOperatorDetails is a type that provides details about a filter operator for a specific column data type.
 * It extends FilterOperatorDetailsBase with additional logic and contraints on the defined properties.
 *
 */
export type FilterOperatorDetails<
  OperatorValue,
  T extends ColumnDataType,
> = FilterOperatorDetailsBase<OperatorValue, T> &
  (
    | { singularOf?: never; pluralOf?: never }
    | { target: 'single'; singularOf: FilterOperators[T]; pluralOf?: never }
    | { target: 'multiple'; singularOf?: never; pluralOf: FilterOperators[T] }
  ) &
  (
    | { isNegated: false; negation: FilterOperators[T]; negationOf?: never }
    | { isNegated: true; negation?: never; negationOf: FilterOperators[T] }
  )

/* Details for all the filter operators for option data type */
export const optionFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is not',
    relativeOf: 'is any of',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is',
    relativeOf: 'is none of',
    isNegated: true,
    negationOf: 'is',
  },
  'is any of': {
    label: 'is any of',
    value: 'is any of',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is',
    isNegated: false,
    negation: 'is none of',
  },
  'is none of': {
    label: 'is none of',
    value: 'is none of',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is not',
    isNegated: true,
    negationOf: 'is any of',
  },
} as const satisfies FilterDetails<'option'>

/* Details for all the filter operators for multi-option data type */
export const multiOptionFilterDetails = {
  include: {
    label: 'include',
    value: 'include',
    target: 'single',
    singularOf: 'include any of',
    relativeOf: 'exclude',
    isNegated: false,
    negation: 'exclude',
  },
  exclude: {
    label: 'exclude',
    value: 'exclude',
    target: 'single',
    singularOf: 'exclude if any of',
    relativeOf: 'include',
    isNegated: true,
    negationOf: 'include',
  },
  'include any of': {
    label: 'include any of',
    value: 'include any of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['exclude if all', 'include all of', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if all',
  },
  'exclude if all': {
    label: 'exclude if all',
    value: 'exclude if all',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'include all of', 'exclude if any of'],
    isNegated: true,
    negationOf: 'include any of',
  },
  'include all of': {
    label: 'include all of',
    value: 'include all of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['include any of', 'exclude if all', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if any of',
  },
  'exclude if any of': {
    label: 'exclude if any of',
    value: 'exclude if any of',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'exclude if all', 'include all of'],
    isNegated: true,
    negationOf: 'include all of',
  },
} as const satisfies FilterDetails<'multiOption'>

/* Details for all the filter operators for date data type */
export const dateFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: 'is after',
    isNegated: false,
    negation: 'is before',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: ['is', 'is before', 'is on or after', 'is after', 'is on or before'],
    isNegated: true,
    negationOf: 'is',
  },
  'is before': {
    label: 'is before',
    value: 'is before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is on or after', 'is after', 'is on or before'],
    isNegated: false,
    negation: 'is on or after',
  },
  'is on or after': {
    label: 'is on or after',
    value: 'is on or after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is before', 'is after', 'is on or before'],
    isNegated: false,
    negation: 'is before',
  },
  'is after': {
    label: 'is after',
    value: 'is after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is before', 'is on or after', 'is on or before'],
    isNegated: false,
    negation: 'is on or before',
  },
  'is on or before': {
    label: 'is on or before',
    value: 'is on or before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is after', 'is on or after', 'is before'],
    isNegated: false,
    negation: 'is after',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'date'>

/* Details for all the filter operators for text data type */
export const textFilterDetails = {
  contains: {
    label: 'contains',
    value: 'contains',
    target: 'single',
    relativeOf: 'does not contain',
    isNegated: false,
    negation: 'does not contain',
  },
  'does not contain': {
    label: 'does not contain',
    value: 'does not contain',
    target: 'single',
    relativeOf: 'contains',
    isNegated: true,
    negationOf: 'contains',
  },
} as const satisfies FilterDetails<'text'>

/* Details for all the filter operators for number data type */
export const numberFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    relativeOf: [
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    relativeOf: [
      'is',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is greater than': {
    label: '>',
    value: 'is greater than',
    target: 'single',
    relativeOf: [
      'is',
      'is not',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is greater than or equal to': {
    label: '>=',
    value: 'is greater than or equal to',
    target: 'single',
    relativeOf: ['is', 'is not', 'is greater than', 'is less than or equal to', 'is less than'],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is less than': {
    label: '<',
    value: 'is less than',
    target: 'single',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than',
  },
  'is less than or equal to': {
    label: '<=',
    value: 'is less than or equal to',
    target: 'single',
    relativeOf: ['is', 'is not', 'is greater than', 'is less than', 'is greater than or equal to'],
    isNegated: false,
    negation: 'is greater than or equal to',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'number'>

/* Maps column data types to their respective filter operator details */
type FilterTypeOperatorDetails = {
  [key in ColumnDataType]: FilterDetails<key>
}

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  text: textFilterDetails,
  number: numberFilterDetails,
  date: dateFilterDetails,
  option: optionFilterDetails,
  multiOption: multiOptionFilterDetails,
}

/*
 *
 * Determines the new operator for a filter based on the current operator, old and new filter values.
 *
 * This handles cases where the filter values have transitioned from a single value to multiple values (or vice versa),
 * and the current operator needs to be transitioned to its plural form (or singular form).
 *
 * For example, if the current operator is 'is', and the new filter values have a length of 2, the
 * new operator would be 'is any of'.
 *
 */
export function determineNewOperator<T extends ColumnDataType>(
  type: T,
  oldVals: Array<FilterTypes[T]>,
  nextVals: Array<FilterTypes[T]>,
  currentOperator: FilterOperators[T]
): FilterOperators[T] {
  const a = Array.isArray(oldVals) && Array.isArray(oldVals[0]) ? oldVals[0].length : oldVals.length
  const b =
    Array.isArray(nextVals) && Array.isArray(nextVals[0]) ? nextVals[0].length : nextVals.length

  // If filter size has not transitioned from single to multiple (or vice versa)
  // or is unchanged, return the current operator.
  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1)) return currentOperator

  const opDetails = filterTypeOperatorDetails[type][currentOperator]

  // Handle transition from single to multiple filter values.
  if (a < b && b >= 2) return opDetails.singularOf ?? currentOperator
  // Handle transition from multiple to single filter values.
  if (a > b && b <= 1) return opDetails.pluralOf ?? currentOperator
  return currentOperator
}

/**********************************************************************************************************
 ***** Filter Functions ******
 **********************************************************************************************************
 * These are functions that filter data based on the current filter values, column data type, and operator.
 * There exists a separate filter function for each column data type.
 *
 * Two variants of the filter functions are provided - as an example, we will take the optionFilterFn:
 * 1. optionFilterFn: takes in a row, columnId, and filterValue.
 * 2. __optionFilterFn: takes in an inputData and filterValue.
 *
 * __optionFilterFn is a private function that is used by filterFn to perform the actual filtering.
 * *********************************************************************************************************/

/*
 * Returns a filter function for a given column data type.
 * This function is used to determine the appropriate filter function to use based on the column data type.
 */
export function filterFn(dataType: ColumnDataType) {
  switch (dataType) {
    case 'option':
      return optionFilterFn
    case 'multiOption':
      return multiOptionFilterFn
    case 'date':
      return dateFilterFn
    case 'text':
      return textFilterFn
    case 'number':
      return numberFilterFn
    default:
      throw new Error('Invalid column data type')
  }
}

export function optionFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'option', TData>
) {
  const value = row.getValue(columnId)

  if (!value) return false

  const columnMeta = filterValue.columnMeta!

  if (typeof value === 'string') {
    return __optionFilterFn(value, filterValue)
  }

  if (isColumnOption(value)) {
    return __optionFilterFn(value.value, filterValue)
  }

  const sanitizedValue = columnMeta.transformOptionFn!(value as never)
  return __optionFilterFn(sanitizedValue.value, filterValue)
}

export function __optionFilterFn<TData>(
  inputData: string,
  filterValue: FilterModel<'option', TData>
) {
  if (!inputData) return false
  if (filterValue.values.length === 0) return true

  const value = inputData.toString().toLowerCase()

  const found = !!filterValue.values.find((v) => v.toLowerCase() === value)

  switch (filterValue.operator) {
    case 'is':
    case 'is any of':
      return found
    case 'is not':
    case 'is none of':
      return !found
  }
}

export function isColumnOption(value: unknown): value is ColumnOption {
  return typeof value === 'object' && value !== null && 'value' in value && 'label' in value
}

export function isColumnOptionArray(value: unknown): value is ColumnOption[] {
  return Array.isArray(value) && value.every(isColumnOption)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function multiOptionFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'multiOption', TData>
) {
  const value = row.getValue(columnId)

  if (!value) return false

  const columnMeta = filterValue.columnMeta!

  if (isStringArray(value)) {
    return __multiOptionFilterFn(value, filterValue)
  }

  if (isColumnOptionArray(value)) {
    return __multiOptionFilterFn(
      value.map((v) => v.value),
      filterValue
    )
  }

  const sanitizedValue = (value as never[]).map((v) => columnMeta.transformOptionFn!(v))

  return __multiOptionFilterFn(
    sanitizedValue.map((v) => v.value),
    filterValue
  )
}

export function __multiOptionFilterFn<TData>(
  inputData: string[],
  filterValue: FilterModel<'multiOption', TData>
) {
  if (!inputData) return false

  if (
    filterValue.values.length === 0 ||
    !filterValue.values[0] ||
    filterValue.values[0].length === 0
  )
    return true

  const values = uniq(inputData)
  const filterValues = uniq(filterValue.values[0])

  switch (filterValue.operator) {
    case 'include':
    case 'include any of':
      return intersection(values, filterValues).length > 0
    case 'exclude':
      return intersection(values, filterValues).length === 0
    case 'exclude if any of':
      return !(intersection(values, filterValues).length > 0)
    case 'include all of':
      return intersection(values, filterValues).length === filterValues.length
    case 'exclude if all':
      return !(intersection(values, filterValues).length === filterValues.length)
  }
}

export function dateFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'date', TData>
) {
  const valueStr = row.getValue<Date>(columnId)

  return __dateFilterFn(valueStr, filterValue)
}

export function __dateFilterFn<TData>(inputData: Date, filterValue: FilterModel<'date', TData>) {
  if (!filterValue || filterValue.values.length === 0) return true

  if (dateFilterDetails[filterValue.operator].target === 'single' && filterValue.values.length > 1)
    throw new Error('Singular operators require at most one filter value')

  if (filterValue.operator in ['is between', 'is not between'] && filterValue.values.length !== 2)
    throw new Error('Plural operators require two filter values')

  const filterVals = filterValue.values
  const d1 = filterVals[0]
  const d2 = filterVals[1]

  const value = inputData

  switch (filterValue.operator) {
    case 'is':
      return isSameDay(value, d1)
    case 'is not':
      return !isSameDay(value, d1)
    case 'is before':
      return isBefore(value, startOfDay(d1))
    case 'is on or after':
      return isSameDay(value, d1) || isAfter(value, startOfDay(d1))
    case 'is after':
      return isAfter(value, startOfDay(d1))
    case 'is on or before':
      return isSameDay(value, d1) || isBefore(value, startOfDay(d1))
    case 'is between':
      return isWithinInterval(value, {
        start: startOfDay(d1),
        end: endOfDay(d2),
      })
    case 'is not between':
      return !isWithinInterval(value, {
        start: startOfDay(filterValue.values[0]),
        end: endOfDay(filterValue.values[1]),
      })
  }
}

export function textFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'text', TData>
) {
  const value = row.getValue<string>(columnId) ?? ''

  return __textFilterFn(value, filterValue)
}

export function __textFilterFn<TData>(inputData: string, filterValue: FilterModel<'text', TData>) {
  if (!filterValue || filterValue.values.length === 0) return true

  const value = inputData.toLowerCase().trim()
  const filterStr = filterValue.values[0].toLowerCase().trim()

  if (filterStr === '') return true

  const found = value.includes(filterStr)

  switch (filterValue.operator) {
    case 'contains':
      return found
    case 'does not contain':
      return !found
  }
}

export function numberFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'number', TData>
) {
  const value = row.getValue<number>(columnId)

  return __numberFilterFn(value, filterValue)
}

export function __numberFilterFn<TData>(
  inputData: number,
  filterValue: FilterModel<'number', TData>
) {
  if (!filterValue || !filterValue.values || filterValue.values.length === 0) {
    return true
  }

  const value = inputData
  const filterVal = filterValue.values[0]

  switch (filterValue.operator) {
    case 'is':
      return value === filterVal
    case 'is not':
      return value !== filterVal
    case 'is greater than':
      return value > filterVal
    case 'is greater than or equal to':
      return value >= filterVal
    case 'is less than':
      return value < filterVal
    case 'is less than or equal to':
      return value <= filterVal
    case 'is between': {
      const lowerBound = filterValue.values[0]
      const upperBound = filterValue.values[1]
      return value >= lowerBound && value <= upperBound
    }
    case 'is not between': {
      const lowerBound = filterValue.values[0]
      const upperBound = filterValue.values[1]
      return value < lowerBound || value > upperBound
    }
    default:
      return true
  }
}

export function createNumberRange(values: number[] | undefined) {
  let a = 0
  let b = 0

  if (!values || values.length === 0) return [a, b]
  if (values.length === 1) {
    a = values[0]
  } else {
    a = values[0]
    b = values[1]
  }

  const [min, max] = a < b ? [a, b] : [b, a]

  return [min, max]
}

/*** Table helpers ***/

export function getColumn<TData>(table: Table<TData>, id: string) {
  const column = table.getColumn(id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

export function getColumnMeta<TData>(table: Table<TData>, id: string) {
  const column = getColumn(table, id)

  if (!column.columnDef.meta) {
    throw new Error(`Column meta not found for column ${id}`)
  }

  return column.columnDef.meta
}

/*** Table Filter Helpers ***/

export function isFilterableColumn<TData>(column: Column<TData>) {
  // 'auto' filterFn doesn't count!
  const hasFilterFn = column.columnDef.filterFn && column.columnDef.filterFn !== 'auto'

  if (column.getCanFilter() && column.accessorFn && hasFilterFn && column.columnDef.meta)
    return true

  if (!column.accessorFn || !column.columnDef.meta) {
    // 1) Column has no accessor function
    //    We assume this is a display column and thus has no filterable data
    // 2) Column has no meta
    //    We assume this column is not intended to be filtered using this component
    return false
  }

  if (!column.accessorFn) {
    warn(`Column "${column.id}" ignored - no accessor function`)
  }

  if (!column.getCanFilter()) {
    warn(`Column "${column.id}" ignored - not filterable`)
  }

  if (!hasFilterFn) {
    warn(
      `Column "${column.id}" ignored - no filter function. use the provided filterFn() helper function`
    )
  }

  return false
}

function warn(...messages: string[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[◐] [filters]', ...messages)
  }
}
