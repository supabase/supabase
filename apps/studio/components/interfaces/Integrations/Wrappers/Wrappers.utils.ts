import { FDW, FDWTable } from 'data/fdw/fdws-query'
import { WRAPPERS, WRAPPER_HANDLERS } from './Wrappers.constants'
import type { WrapperMeta } from './Wrappers.types'

export const makeValidateRequired = (options: { name: string; required: boolean }[]) => {
  const requiredOptionsSet = new Set(
    options.filter((option) => option.required).map((option) => option.name)
  )

  const requiredArrayOptionsSet = new Set(
    Array.from(requiredOptionsSet).filter((option) => option.includes('.'))
  )
  const requiredArrayOptions = Array.from(requiredArrayOptionsSet)

  return (values: Record<string, any>) => {
    const errors = Object.fromEntries(
      Object.entries(values)
        .flatMap(([key, value]) =>
          Array.isArray(value)
            ? [[key, value], ...value.map((v, i) => [`${key}.${i}`, v])]
            : [[key, value]]
        )
        .filter(([_key, value]) => {
          const [key, idx] = _key.split('.')

          if (
            idx !== undefined &&
            requiredOptionsSet.has(key) &&
            Object.keys(value).some((subKey) => requiredArrayOptionsSet.has(`${key}.${subKey}`))
          ) {
            const arrayOption = requiredArrayOptions.find((option) => option.startsWith(`${key}.`))
            if (arrayOption) {
              const subKey = arrayOption.split('.')[1]
              return !value[subKey]
            }

            return false
          }

          return requiredOptionsSet.has(key) && (Array.isArray(value) ? value.length < 1 : !value)
        })
        .map(([key]) => {
          if (key === 'table_name') return [key, 'Please provide a name for your table']
          else if (key === 'columns') return [key, 'Please select at least one column']
          else return [key, 'This field is required']
        })
    )

    return errors
  }
}

export interface FormattedWrapperTable {
  index: number
  columns: { name: string }[]
  is_new_schema: boolean
  schema: string
  schema_name: string
  table_name: string
  object?: string // From options object for Firebase/Stripe
  [key: string]: any // For other dynamic options from table.options
}

export const formatWrapperTables = (
  wrapper: { handler: string; tables?: FDWTable[] },
  wrapperMeta?: WrapperMeta
): FormattedWrapperTable[] => {
  const tables = wrapper?.tables ?? []

  return tables.map((table) => {
    let index: number = 0
    const options = Object.fromEntries(table.options.map((option: string) => option.split('=')))

    switch (wrapper.handler) {
      case WRAPPER_HANDLERS.STRIPE:
        index =
          wrapperMeta?.tables.findIndex(
            (x) => x.options.find((x) => x.name === 'object')?.defaultValue === options.object
          ) ?? 0
        break
      case WRAPPER_HANDLERS.FIREBASE:
        if (options.object === 'auth/users') {
          index =
            wrapperMeta?.tables.findIndex((x) =>
              x.options.find((x) => x.defaultValue === 'auth/users')
            ) ?? 0
        } else {
          index = wrapperMeta?.tables.findIndex((x) => x.label === 'Firestore Collection') ?? 0
        }
        break
      case WRAPPER_HANDLERS.S3:
      case WRAPPER_HANDLERS.AIRTABLE:
      case WRAPPER_HANDLERS.LOGFLARE:
      case WRAPPER_HANDLERS.BIG_QUERY:
      case WRAPPER_HANDLERS.CLICK_HOUSE:
        break
    }

    return {
      ...options,
      index,
      id: table.id,
      columns: table.columns,
      is_new_schema: false,
      schema: table.schema,
      schema_name: table.schema,
      table_name: table.name,
    }
  })
}

export const convertKVStringArrayToJson = (values: string[]): Record<string, string> => {
  return Object.fromEntries(values.map((value) => value.split('=')))
}

export function wrapperMetaComparator(
  wrapperMeta: Pick<WrapperMeta, 'handlerName' | 'server'>,
  wrapper: FDW | undefined
) {
  if (wrapperMeta.handlerName === 'wasm_fdw_handler') {
    const serverOptions = convertKVStringArrayToJson(wrapper?.server_options ?? [])
    return (
      wrapperMeta.server.options.find((option) => option.name === 'fdw_package_name')
        ?.defaultValue === serverOptions['fdw_package_name']
    )
  }

  return wrapperMeta.handlerName === wrapper?.handler
}

export function getWrapperMetaForWrapper(wrapper: FDW | undefined) {
  return WRAPPERS.find((w) => wrapperMetaComparator(w, wrapper))
}
