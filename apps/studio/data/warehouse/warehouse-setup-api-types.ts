import type { components } from 'api-types'

/**
 * Temporary hand-written types for the v2 Warehouse setup operations (supabase/platform#41439):
 *
 * - `POST /v2/projects/{ref}/warehouse/setups` (`v2-create-warehouse-setup`)
 * - `GET /v2/projects/{ref}/warehouse/setups/current` (`v2-get-warehouse-setup`)
 *
 * They mirror what the generated types will contain, reusing the legacy schemas for every field
 * that did not change. Generated `packages/api-types/types/**` must match production, and these
 * routes are not deployed yet. Once `pnpm api:codegen:prod` produces them, delete this file and use
 * `components['schemas']['V2WarehouseSetupRequest']`,
 * `components['schemas']['V2WarehouseSetupAcceptedResponse_Output']` and
 * `components['schemas']['V2WarehouseSetupStatusResponse_Output']`.
 */

type LegacySetupBody = components['schemas']['WarehouseSetupBody']
type LegacySetupResponse = components['schemas']['WarehouseSetupResponse_Output']
type LegacyStatusResponse = components['schemas']['WarehouseSetupStatusResponse_Output']
type ErrorResponseBody = components['schemas']['ErrorResponseBody']

export type V2WarehouseSetupRequest = {
  data: {
    type: 'warehouse_setup'
    attributes: LegacySetupBody
  }
}

export type V2WarehouseSetupAcceptedResponse = {
  data: {
    type: 'warehouse_setup'
    id: string
    attributes: LegacySetupResponse & {
      accepted: true
      selected_tables: { id: number; name: string; schema: string }[]
    }
  }
}

export type V2WarehouseSetupStatusResponse = {
  data: {
    type: 'warehouse_setup'
    id: string
    attributes: Omit<LegacyStatusResponse, 'tables'> & {
      replication_state: string
      /** Current enablement readiness: running until copy, pipeline and routing are all ready. */
      status: 'failed' | 'running' | 'succeeded'
      status_error?: string
      tables: (LegacyStatusResponse['tables'][number] & {
        id: number
        /** Null when no observation is available. */
        replication_state: string | null
      })[]
    }
  }
}

declare module 'api-types' {
  interface paths {
    '/v2/projects/{ref}/warehouse/setups': {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get?: never
      put?: never
      /** Set up Warehouse or replace its replication selection */
      post: {
        parameters: {
          query?: never
          header?: never
          path: {
            /** Project ref */
            ref: string
          }
          cookie?: never
        }
        requestBody: {
          content: {
            'application/json': V2WarehouseSetupRequest
          }
        }
        responses: {
          202: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': V2WarehouseSetupAcceptedResponse
            }
          }
          /** @description Empty or unsupported selection */
          400: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Unauthorized */
          401: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description This feature requires the Pro, Team, or Enterprise organization plan. */
          402: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Forbidden action */
          403: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Source identity or lifecycle conflict */
          409: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Rate limit exceeded */
          429: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Warehouse setup unavailable */
          503: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
        }
      }
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    '/v2/projects/{ref}/warehouse/setups/current': {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      /** Get Warehouse initial synchronization status */
      get: {
        parameters: {
          query?: {
            /** Defaults to true for current-status reads and false when selection_id is supplied. */
            inspect_fdw?: 'false' | 'true'
            /** Accepted selection identity returned by enable. */
            selection_id?: string
          }
          header?: never
          path: {
            /** Project ref */
            ref: string
          }
          cookie?: never
        }
        requestBody?: never
        responses: {
          200: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': V2WarehouseSetupStatusResponse
            }
          }
          /** @description Unauthorized */
          401: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Forbidden action */
          403: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description The accepted selection changed */
          409: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Rate limit exceeded */
          429: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
          /** @description Warehouse status unavailable */
          503: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': ErrorResponseBody
            }
          }
        }
      }
      put?: never
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
  }
}
