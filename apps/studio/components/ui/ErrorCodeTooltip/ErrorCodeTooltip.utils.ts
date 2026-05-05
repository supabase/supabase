import {
  ERROR_CODE_DOCS_URLS,
  ERROR_CODES,
  HTTP_ERROR_CODES,
  type ErrorCodeDefinition,
  type ErrorCodeService,
} from 'shared-data'

import { Service } from '@/data/graphql/graphql'

const SERVICE_MAP: Partial<Record<Service, ErrorCodeService>> = {
  [Service.Auth]: 'auth',
  [Service.Realtime]: 'realtime',
}

export interface ErrorCodeInfo {
  definition: ErrorCodeDefinition | undefined
  docsUrl: string | undefined
}

export function getErrorCodeInfo(errorCode: string, service: Service | undefined): ErrorCodeInfo {
  const mappedService = service ? SERVICE_MAP[service] : undefined

  const definition = mappedService
    ? (ERROR_CODES[mappedService]?.[errorCode] ??
      HTTP_ERROR_CODES[mappedService]?.[Number(errorCode)])
    : undefined

  const docsUrl = mappedService ? ERROR_CODE_DOCS_URLS[mappedService] : undefined

  return { definition, docsUrl }
}
