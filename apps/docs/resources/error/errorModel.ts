import { type PostgrestError } from '@supabase/supabase-js'
import {
  ApiErrorGeneric,
  CollectionQueryError,
  convertPostgrestToApiError,
  NoDataError,
} from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { supabase } from '~/lib/supabase'
import { type CollectionFetch } from '../utils/connections'

export const SERVICES = {
  AUTH: {
    value: 'AUTH',
  },
  REALTIME: {
    value: 'REALTIME',
  },
  STORAGE: {
    value: 'STORAGE',
  },
} as const

type Service = keyof typeof SERVICES
type ErrorCollectionFetch = CollectionFetch<
  ErrorModel,
  { service?: Service; code?: string }
>['fetch']

export class ErrorModel {
  public id: string
  public code: string
  public service: Service
  public httpStatusCode?: number
  public message?: string

  constructor({
    id,
    code,
    service,
    httpStatusCode,
    message,
  }: {
    id: string
    code: string
    service: Service
    httpStatusCode?: number
    message?: string
  }) {
    this.id = id
    this.code = code
    this.service = service
    this.httpStatusCode = httpStatusCode
    this.message = message
  }

  static async loadSingleError({
    code,
    service,
  }: {
    code: string
    service: Service
  }): Promise<Result<ErrorModel, ApiErrorGeneric>> {
    return new Result(
      await supabase()
        .schema('content')
        .from('error')
        .select('id, code, service(name), httpStatusCode:http_status_code, message')
        .eq('code', code)
        .eq('service.name', service)
        .is('deleted_at', null)
        .single<{
          id: string
          code: string
          service: {
            name: Service
          }
          httpStatusCode?: number
          message?: string
        }>()
    )
      .map((data) => {
        return new ErrorModel({
          ...data,
          service: data.service.name,
        })
      })
      .mapError((error) => {
        if (error.code === 'PGRST116') {
          return new NoDataError('Error for given code and service does not exist', error)
        }
        return convertPostgrestToApiError(error)
      })
  }

  static async loadErrors(
    args: Parameters<ErrorCollectionFetch>[0]
  ): ReturnType<ErrorCollectionFetch> {
    const PAGE_SIZE = 20
    const limit = args?.first ?? args?.last ?? PAGE_SIZE
    const service = args?.additionalArgs?.service as Service | undefined
    const code = args?.additionalArgs?.code as string | undefined

    const [countResult, errorCodesResult] = await Promise.all([
      fetchTotalErrorCount(service, code),
      fetchErrorDescriptions({
        after: args?.after ?? undefined,
        before: args?.before ?? undefined,
        reverse: !!args?.last,
        limit: limit + 1,
        service,
        code,
      }),
    ])

    return countResult
      .join(errorCodesResult)
      .map(([count, errorCodes]) => {
        const hasMoreItems = errorCodes.length > limit
        const items = args?.last ? errorCodes.slice(1) : errorCodes.slice(0, limit)

        return {
          items: items.map((errorCode) => new ErrorModel(errorCode)),
          totalCount: count,
          hasNextPage: args?.last ? !!args?.before : hasMoreItems,
          hasPreviousPage: args?.last ? hasMoreItems : !!args?.after,
        }
      })
      .mapError(([countError, errorCodeError]) => {
        return CollectionQueryError.fromErrors(countError, errorCodeError)
      })
  }
}

async function fetchTotalErrorCount(
  service?: Service,
  code?: string
): Promise<Result<number, PostgrestError>> {
  const query = supabase()
    .schema('content')
    .from('error')
    .select('id, service!inner(name)', { count: 'exact', head: true })
    .is('deleted_at', null)

  if (service) {
    query.eq('service.name', service)
  }

  if (code) {
    query.eq('code', code)
  }

  const { count, error } = await query
  if (error) {
    return Result.error(error)
  }
  return Result.ok(count ?? 0)
}

type ErrorDescription = {
  id: string
  code: string
  service: Service
  httpStatusCode?: number
  message?: string
}

async function fetchErrorDescriptions({
  after,
  before,
  reverse,
  limit,
  service,
  code,
}: {
  after?: string
  before?: string
  reverse: boolean
  limit: number
  service?: Service
  code?: string
}): Promise<Result<ErrorDescription[], PostgrestError>> {
  const query = supabase()
    .schema('content')
    .from('error')
    .select('id, code, service!inner(name), httpStatusCode: http_status_code, message')
    .is('deleted_at', null)
    .order('id', { ascending: reverse ? false : true })

  if (service) {
    query.eq('service.name', service)
  }
  if (code) {
    query.eq('code', code)
  }
  if (after != undefined) {
    query.gt('id', after)
  }
  if (before != undefined) {
    query.lt('id', before)
  }
  query.limit(limit)

  const result = await query
  return new Result(result).map((results) => {
    const transformedResults = (reverse ? results.toReversed() : results).map((error) => ({
      ...error,
      service: error.service.name,
    }))
    return transformedResults as ErrorDescription[]
  })
}
