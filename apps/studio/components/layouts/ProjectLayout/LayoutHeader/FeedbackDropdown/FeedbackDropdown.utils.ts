import { createClient } from '@supabase/supabase-js'
import { uuidv4 } from 'lib/helpers'

const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''

export const convertB64toBlob = (image: string) => {
  const contentType = 'image/png'
  const byteCharacters = atob(image.substr(`data:${contentType};base64,`.length))
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }
  const blob = new Blob(byteArrays, { type: contentType })
  return blob
}

export const uploadAttachment = async (ref: string, image: string) => {
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

  const blob = convertB64toBlob(image)
  const name = `${ref || 'no-project'}/${uuidv4()}.png`
  const options = { cacheControl: '3600' }
  const { data: file, error: uploadError } = await supabaseClient.storage
    .from('feedback-attachments')
    .upload(name, blob, options)

  if (uploadError) {
    console.error('Failed to upload:', uploadError)
    return undefined
  }

  if (file) {
    const { data } = await supabaseClient.storage
      .from('feedback-attachments')
      .createSignedUrls([file.path], 10 * 365 * 24 * 60 * 60)
    return data?.[0].signedUrl
  }

  return undefined
}
