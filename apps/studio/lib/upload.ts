import { createClient } from '@supabase/supabase-js'

const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''

// [Joshen TODO] Feedback form and support attachments should use this
export const uploadAttachment = async (
  bucket: string,
  fileName: string,
  image: File,
  getUrl: boolean = true
) => {
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

  const options = { cacheControl: '3600' }

  const { data: file, error } = await supabaseClient.storage
    .from(bucket)
    .upload(fileName, image, options)

  if (error) {
    console.error('Failed to upload:', error)
    return undefined
  }

  if (file && getUrl) {
    const { data } = await supabaseClient.storage.from(bucket).getPublicUrl(file.path)
    return data?.publicUrl
  }

  return undefined
}
