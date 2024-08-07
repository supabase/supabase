import { createClient } from '@supabase/supabase-js'

const SUPABASE_COM_URL = process.env.NEXT_PUBLIC_SUPABASE_COM_URL || ''
const SUPABASE_COM_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_COM_ANON_KEY || ''

// Used to upload images to the supabase-com project. The images will be used for integrations pages.
export const uploadFileToSupabaseComProject = async (
  bucket: string,
  fileName: string,
  image: File,
  getUrl: boolean = true
) => {
  const supabaseClient = createClient(SUPABASE_COM_URL, SUPABASE_COM_ANON_KEY, {
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
