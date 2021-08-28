import useSWR, { mutate } from 'swr'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from './constants'
import { OpenAPIV2 } from 'openapi-types'
import axios from 'axios'
import { PostgresTable, PostgresMetaResult, PostgresGrant } from '@supabase/postgres-meta'

export const fetcher = (input: RequestInfo, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json())

/**
 * Return the Open API docs for the project's API
 */
export const fetchOpenApiSpec = () => {
  const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`
  const { data, error } = useSWR<OpenAPIV2.Document>(url, fetcher)

  const tables = data?.definitions
    ? Object.entries(data.definitions).map(([key, table]) => ({
        ...table,
        name: key,
        fields: Object.entries(table.properties || {}).map(([key, field]) => ({
          ...field,
          name: key,
        })),
      }))
    : []
  const functions = data?.paths
    ? Object.entries(data.paths)
        .map(([path, value]) => ({
          ...value,
          path,
          name: path.replace('/rpc/', ''),
        }))
        .filter((x) => x.path.includes('/rpc'))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return {
    data,
    error,
    tables,
    functions,
    isLoading: !data && !data,
  }
}

const PG_META_URL = 'http://localhost:1337'

type NewTable = {
  name: string
  comment?: string
  primaryKey?: NewPrimaryKey
}

type NewPrimaryKey = {
  name: string
  type: string
  defaultValueFormat?: string
  isPrimaryKey: boolean
  isIdentity: boolean
}

export const createTable = async (newTable: NewTable) => {
  const { primaryKey, ...tableData } = newTable

  try {
    const { data: tableResult } = await axios.post(`${PG_META_URL}/tables`, tableData)
    const { id: table_id } = tableResult

    const {
      name,
      type,
      defaultValueFormat: default_value_format,
      isPrimaryKey: is_primary_key,
      isIdentity: is_identity,
    } = primaryKey!
    const columnData = { table_id, name, type, default_value_format, is_primary_key, is_identity }

    const { data: columnResult } = await axios.post(`${PG_META_URL}/columns`, columnData)
    mutate(`${PG_META_URL}/tables`, tableResult)
    return columnResult
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const tableFetcher = (input: RequestInfo, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json())
/**
 * Return the table data for table editor
 */
export const fetchTableData = () => {
  const url = `${PG_META_URL}/tables`
  const { data, error } = useSWR<PostgresMetaResult<[PostgresTable]>>(url, tableFetcher)

  const tables =
    data && Array.isArray(data)
      ? data.filter((t) => t.schema == 'public').sort((a, b) => a.name.localeCompare(b.name))
      : []

  return {
    data,
    error,
    tables,
    isLoading: !data && !data,
  }
}
