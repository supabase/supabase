import { compact } from 'lodash'
import { createClient } from '@supabase/supabase-js'
import { uuidv4 } from 'lib/helpers'

const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''
const supportSupabaseClient = createClient(SUPPORT_API_URL, SUPPORT_API_KEY, {
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

export function formReducer(state: any, action: any) {
  return {
    ...state,
    [action.name]: {
      value: action.value,
      error: action.error,
    },
  }
}

export const uploadAttachments = async (ref: string, files: File[]) => {
  const filesToUpload = Array.from(files)
  const uploadedFiles = await Promise.all(
    filesToUpload.map(async (file) => {
      const suffix = file.type.split('/')[1]
      const prefix = `${ref}/${uuidv4()}.${suffix}`
      const options = { cacheControl: '3600' }

      const { data, error } = await supportSupabaseClient.storage
        .from('support-attachments')
        .upload(prefix, file, options)

      if (error) console.error('Failed to upload:', file.name, error)
      return data
    })
  )
  const keys = compact(uploadedFiles).map((file) => file.path)

  const { data, error } = await supportSupabaseClient.storage
    .from('support-attachments')
    .createSignedUrls(keys, 10 * 365 * 24 * 60 * 60)
  if (error) {
    console.error('Failed to retrieve URLs for attachments', error)
  }
  return data ? data.map((file) => file.signedUrl) : []
}

export const formatMessage = (message: string, attachments: string[]) => {
  const formattedMessage = message.replace(/\n/g, '<br/>')
  if (attachments.length > 0) {
    const attachmentsImg = attachments.map(
      (url) => `<img src=${url} width="200" style="margin-right:10px" />`
    )
    return `${formattedMessage}<br/><hr/><b>Uploaded attachments:</b><br/><div style="display:flex;align-items:center">${attachmentsImg.join(
      ''
    )}</div>`
  } else {
    return formattedMessage
  }
}
