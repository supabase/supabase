import useSWR from 'swr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'

export const fetcher = (input: RequestInfo, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json())

/**
 * Return the Open API docs for the project's API
 */
export const fetchOpenApiSpec = () => {
  const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`
  return useSWR(url, fetcher)
}
