export const PGMQ_EXTENSION_NAME = 'pgmq' as const

export const DEFAULT_PGMQ_VERSION = '1.5.1' as const
export const SUPPORTED_PGMQ_VERSIONS = ['1.4.4', DEFAULT_PGMQ_VERSION] as const

export type SupportedPgmqVersion = (typeof SUPPORTED_PGMQ_VERSIONS)[number]
