import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'
import { isArrayOfDates } from 'components/interfaces/DataTableDemo/lib/is-array'
import { ColumnFiltersState } from '@tanstack/react-table'
import { ParserBuilder } from 'nuqs'
import type { DataTableFilterField } from '../types'

/**
 * Extracts the word from the given string at the specified caret position.
 */
export function getWordByCaretPosition({
  value,
  caretPosition,
}: {
  value: string
  caretPosition: number
}) {
  let start = caretPosition
  let end = caretPosition

  while (start > 0 && value[start - 1] !== ' ') start--
  while (end < value.length && value[end] !== ' ') end++

  const word = value.substring(start, end)
  return word
}

export function replaceInputByFieldType<TData>({
  prev,
  currentWord,
  optionValue,
  value,
  field,
}: {
  prev: string
  currentWord: string
  optionValue?: string | number | boolean | undefined // FIXME: use DataTableFilterField<TData>["options"][number];
  value: string
  field: DataTableFilterField<TData>
}) {
  switch (field.type) {
    case 'checkbox': {
      if (currentWord.includes(ARRAY_DELIMITER)) {
        const words = currentWord.split(ARRAY_DELIMITER)
        words[words.length - 1] = `${optionValue}`
        const input = prev.replace(currentWord, words.join(ARRAY_DELIMITER))
        return `${input.trim()} `
      }
    }
    case 'slider': {
      if (currentWord.includes(SLIDER_DELIMITER)) {
        const words = currentWord.split(SLIDER_DELIMITER)
        words[words.length - 1] = `${optionValue}`
        const input = prev.replace(currentWord, words.join(SLIDER_DELIMITER))
        return `${input.trim()} `
      }
    }
    case 'timerange': {
      if (currentWord.includes(RANGE_DELIMITER)) {
        const words = currentWord.split(RANGE_DELIMITER)
        words[words.length - 1] = `${optionValue}`
        const input = prev.replace(currentWord, words.join(RANGE_DELIMITER))
        return `${input.trim()} `
      }
    }
    default: {
      const input = prev.replace(currentWord, value)
      return `${input.trim()} `
    }
  }
}

export function getFieldOptions<TData>({ field }: { field: DataTableFilterField<TData> }) {
  switch (field.type) {
    case 'slider': {
      return field.options?.length
        ? field.options
            .map(({ value }) => value)
            .sort((a, b) => Number(a) - Number(b))
            .filter(notEmpty)
        : Array.from({ length: field.max - field.min + 1 }, (_, i) => field.min + i) || []
    }
    default: {
      return field.options?.map(({ value }) => value).filter(notEmpty) || []
    }
  }
}

export function getFilterValue({
  value,
  search,
  currentWord,
}: {
  value: string
  search: string
  keywords?: string[] | undefined
  currentWord: string
}): number {
  /**
   * @example value "suggestion:public:true regions,ams,gru,fra"
   */
  if (value.startsWith('suggestion:')) {
    const rawValue = value.toLowerCase().replace('suggestion:', '')
    if (rawValue.includes(search)) return 1
    return 0
  }

  /** */
  if (value.toLowerCase().includes(currentWord.toLowerCase())) return 1

  /**
   * @example checkbox [filter, query] = ["regions", "ams,gru,fra"]
   * @example slider [filter, query] = ["p95", "0-3000"]
   * @example input [filter, query] = ["name", "api"]
   */
  const [filter, query] = currentWord.toLowerCase().split(':')
  if (query && value.startsWith(`${filter}:`)) {
    if (query.includes(ARRAY_DELIMITER)) {
      /**
       * array of n elements
       * @example queries = ["ams", "gru", "fra"]
       */
      const queries = query.split(ARRAY_DELIMITER)
      const rawValue = value.toLowerCase().replace(`${filter}:`, '')
      if (queries.some((item, i) => item === rawValue && i !== queries.length - 1)) return 0
      if (queries.some((item) => rawValue.includes(item))) return 1
    }
    if (query.includes(SLIDER_DELIMITER)) {
      /**
       * range between 2 elements
       * @example queries = ["0", "3000"]
       */
      const queries = query.split(SLIDER_DELIMITER)
      const rawValue = value.toLowerCase().replace(`${filter}:`, '')

      const rawValueAsNumber = Number.parseInt(rawValue)
      const queryAsNumber = Number.parseInt(queries[0])

      if (queryAsNumber < rawValueAsNumber) {
        if (rawValue.includes(queries[1])) return 1
        return 0
      }
      return 0
    }
    const rawValue = value.toLowerCase().replace(`${filter}:`, '')
    if (rawValue.includes(query)) return 1
  }
  return 0
}

export function getFieldValueByType<TData>({
  field,
  value,
}: {
  field?: DataTableFilterField<TData>
  value: unknown
}) {
  if (!field) return null

  switch (field.type) {
    case 'slider': {
      if (Array.isArray(value)) {
        return value.join(SLIDER_DELIMITER)
      }
      return value
    }
    case 'checkbox': {
      if (Array.isArray(value)) {
        return value.join(ARRAY_DELIMITER)
      }
      // REMINER: inversed logic
      if (typeof value === 'string') {
        return value.split(ARRAY_DELIMITER)
      }
      return value
    }
    case 'timerange': {
      if (Array.isArray(value)) {
        if (isArrayOfDates(value)) {
          return value.map((date) => date.getTime()).join(RANGE_DELIMITER)
        }
        return value.join(RANGE_DELIMITER)
      }
      if (value instanceof Date) {
        return value.getTime()
      }
      return value
    }
    default: {
      return value
    }
  }
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

export function columnFiltersParser<TData>({
  searchParamsParser,
  filterFields,
}: {
  searchParamsParser: Record<string, ParserBuilder<any>>
  filterFields: DataTableFilterField<TData>[]
}) {
  return {
    parse: (inputValue: string) => {
      const values = inputValue
        .trim()
        .split(' ')
        .reduce(
          (prev, curr) => {
            const [name, value] = curr.split(':')
            if (!value || !name) return prev
            prev[name] = value
            return prev
          },
          {} as Record<string, string>
        )

      const searchParams = Object.entries(values).reduce(
        (prev, [key, value]) => {
          const parser = searchParamsParser[key]
          if (!parser) return prev

          prev[key] = parser.parse(value)
          return prev
        },
        {} as Record<string, unknown>
      )

      return searchParams
    },
    serialize: (columnFilters: ColumnFiltersState) => {
      const values = columnFilters.reduce((prev, curr) => {
        const { commandDisabled } = filterFields?.find((field) => curr.id === field.value) || {
          commandDisabled: true,
        } // if column filter is not found, disable the command by default
        const parser = searchParamsParser[curr.id]

        if (commandDisabled || !parser) return prev

        return `${prev}${curr.id}:${parser.serialize(curr.value)} `
      }, '')

      return values
    },
  }
}
