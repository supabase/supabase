import { RequestGenericInterface } from 'fastify'

export interface AuthenticatedRequest extends RequestGenericInterface {
  Headers: {
    authorization: string
  }
}
export interface AuthenticatedRangeRequest extends RequestGenericInterface {
  Headers: {
    authorization: string
    range?: string
  }
}
