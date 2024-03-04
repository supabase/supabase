import PQueue from 'p-queue'

export const SupabaseGridQueue = new PQueue({ concurrency: 1 })
