import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  StorageBucket,
  StorageObject,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'

/** Storage bucket/object reads backed by supabase-js `.storage` (both backends). */
export function createStorageOps(supabase: SupabaseClient) {
  return {
    async listBuckets(): Promise<StorageBucket[]> {
      const { data, error } = await supabase.storage.listBuckets()
      if (error) throw error
      return (data ?? []) as StorageBucket[]
    },

    async listObjects(bucketId: string, path = ''): Promise<StorageObject[]> {
      const { data, error } = await supabase.storage.from(bucketId).list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) throw error
      return (data ?? []) as StorageObject[]
    },
  }
}
