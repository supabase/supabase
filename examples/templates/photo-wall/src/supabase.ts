import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
}

export const supabase = createClient(url, key)

export interface Wall {
  id: string
  name: string
}

/**
 * Public URL for a photo. With `width`, Storage resizes the image on the fly
 * (image transformations) and the CDN caches each size.
 */
export function photoUrl(path: string, width?: number) {
  const bucket = supabase.storage.from('photos')
  if (!width) return bucket.getPublicUrl(path).data.publicUrl
  return bucket.getPublicUrl(path, { transform: { width, resize: 'contain', quality: 75 } }).data
    .publicUrl
}
