import useSWR from 'swr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'
import { OpenAPIV2 } from 'openapi-types'

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
