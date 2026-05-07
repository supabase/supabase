import { handleError } from 'data/fetchers'
import type { TypedDocumentString } from './graphql'

export async function executeGraphQL<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  { variables, signal }: { variables?: TVariables; signal?: AbortSignal }
) {
  try {
    const response = await fetch('/api/content/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed network response from Content API')
    }

    const { data, errors } = await response.json()
    if (errors) {
      throw errors
    }

    return data as TResult
  } catch (err) {
    handleError(err)
  }
}
