import { ApiErrorGeneric, convertPostgrestToApiError, NoDataError } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { supabase } from '~/lib/supabase'

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

export class ErrorModel {
  public code: string
  public service: Service
  public httpStatusCode?: number
  public message?: string

  constructor({
    code,
    service,
    httpStatusCode: httpStatusCode,
    message,
  }: {
    code: string
    service: Service
    httpStatusCode?: number
    message?: string
  }) {
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
        .select('code, ...service(service:name), httpStatusCode:http_status_code, message')
        .eq('code', code)
        .eq('service.name', service)
        .is('deleted_at', null)
        .single<{
          code: string
          service: Service
          httpStatusCode?: number
          message?: string
        }>()
    )
      .map((data) => {
        return new ErrorModel(data)
      })
      .mapError((error) => {
        if (error.code === 'PGRST116') {
          return new NoDataError('Error for given code and service does not exist', error)
        }
        return convertPostgrestToApiError(error)
      })
  }
}
