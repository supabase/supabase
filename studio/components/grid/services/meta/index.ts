import { Dictionary, ServiceError } from '../../types'

export interface IMetaService {
  fetchInfo: (
    name: string,
    schema?: string
  ) => Promise<{ data?: Dictionary<any>; error?: ServiceError }>
  fetchColumns: (
    name: string,
    schema?: string
  ) => Promise<{ data?: Dictionary<any>[]; error?: ServiceError }>
  fetchPrimaryKeys: (
    name: string,
    schema?: string
  ) => Promise<{ data?: Dictionary<any>[]; error?: ServiceError }>
  fetchRelationships: (
    name: string,
    schema?: string
  ) => Promise<{ data?: Dictionary<any>[]; error?: ServiceError }>
}

export * from './SqlMetaService'
