import { createClient } from '@supabase/supabase-js'
import { uuidv4 } from 'lib/helpers'

const BUCKET_NAME = 'oauth-app-icons'
const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''

export const uploadAttachment = async (slug: string, image: File) => {
  const supabaseClient = createClient(SUPPORT_API_URL, SUPPORT_API_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // @ts-ignore
      multiTab: false,
      detectSessionInUrl: false,
      localStorage: {
        getItem: (key: string) => undefined,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      },
    },
  })

  const name = `${slug}/${uuidv4()}.png`
  const options = { cacheControl: '3600' }

  const { data: file, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(name, image, options)

  if (error) {
    console.error('Failed to upload:', error)
    return undefined
  }

  if (file) {
    const { data } = await supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(file.path)
    return data?.publicUrl
  }

  return undefined
}
