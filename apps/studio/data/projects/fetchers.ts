// [Joshen] These are being placed separately as they're also being used in the API
// which we should avoid mixing client side and server side logic (main problem was importing of react query)

import { get, handleError } from 'data/fetchers'

export async function getProjects({
  signal,
  headers,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
}) {
  const { data, error } = await get('/platform/projects', { signal, headers })

  if (error) handleError(error)
  // The /platform/projects endpoint has a v2 which is activated by passing a {version: '2'} header. The v1 API returns
  // all projects while the v2 returns paginated list of projects. Wrapping the v1 API response into a
  // { projects: ProjectInfo[] } is intentional to be forward compatible with the structure of v2 for easier migration.
  return { projects: data }
}
