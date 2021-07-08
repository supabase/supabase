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
  
  return {
    data,
    error,
    isLoading: !data && !data,
  }
}
