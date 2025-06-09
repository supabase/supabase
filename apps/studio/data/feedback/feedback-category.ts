import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { constructHeaders, fetchHandler, handleError } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'

export type FeedbackCategoryVariables = {
  prompt: string
}

export type FeedbackCategory = string | null
export type FeedbackCategoryError = Error

export async function getFeedbackCategory(
  { prompt }: FeedbackCategoryVariables,
  signal?: AbortSignal
): Promise<FeedbackCategory> {
  if (!prompt) return null

  const headers = await constructHeaders({
    'Content-Type': 'application/json',
  })

  const response = await fetchHandler(`${BASE_PATH}/api/ai/feedback/classify`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers,
    credentials: 'include',
    signal,
  })

  if (!response.ok) {
    const { error } = await response.json()
    handleError(
      typeof error === 'object'
        ? error
        : typeof error === 'string'
          ? { message: error }
          : { message: 'Unknown error' }
    )
  }

  const data = await response.json()
  return data.feedback_category
}

export const useFeedbackCategoryQuery = <TData = FeedbackCategory>(
  { prompt }: FeedbackCategoryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FeedbackCategory, FeedbackCategoryError, TData> = {}
) =>
  useQuery<FeedbackCategory, FeedbackCategoryError, TData>(
    ['feedback-category', prompt],
    ({ signal }) => getFeedbackCategory({ prompt }, signal),
    {
      enabled: enabled && !!prompt,
      ...options,
    }
  )
