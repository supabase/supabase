export const SYNC_JOB_ID = '__sync'

/**
 * Placeholder tenant for events that run across the whole fleet
 * (e.g. pg-boss maintenance) and have no single tenant context.
 */
export const SYSTEM_TENANT_REF = 'SYSTEM_TENANT' as const
export const SYSTEM_TENANT = { ref: '', host: '' } as const
