import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { graphql } from 'data/graphql'
import { executeGraphQL } from 'data/graphql/execute'
import { Service } from 'data/graphql/graphql'
import { contentApiKeys } from './keys'

const ErrorCodeQuery = graphql(`
  query ErrorCodeQuery($code: String!, $service: Service) {
    errors(code: $code, service: $service) {
      nodes {
        code
        service
        message
      }
    }
  }
`)

interface Variables {
  code: string
  service?: Service
}

async function getErrorCodeDescriptions({ code, service }: Variables, signal?: AbortSignal) {
  return await executeGraphQL(ErrorCodeQuery, { variables: { code, service }, signal })
}

type ErrorCodeDescriptionsData = Awaited<ReturnType<typeof getErrorCodeDescriptions>>
type ErrorCodeDescriptionsError = unknown

export const useErrorCodesQuery = <TData = ErrorCodeDescriptionsData>(
  variables: Variables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ErrorCodeDescriptionsData, ErrorCodeDescriptionsError, TData> = {}
) => {
  return useQuery<ErrorCodeDescriptionsData, ErrorCodeDescriptionsError, TData>(
    contentApiKeys.errorCodes(variables),
    ({ signal }) => getErrorCodeDescriptions(variables, signal),
    { enabled, ...options }
  )
}
