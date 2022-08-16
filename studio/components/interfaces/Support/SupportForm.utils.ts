import { createClient } from '@supabase/supabase-js'
import { IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { post } from 'lib/common/fetch'

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
  return Promise.all(
    filesToUpload.map(async (file) => {
      // [Joshen] Left off here - trying to figure out how to
      // pass the files into the next API, which will upload the files then through
      // the Supabase client
      const res = await post('/api/upload-attachments', files, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // const prefix = `${ref}/${uuidv4()}`
      // const options = { cacheControl: '3600' }

      // const { data, error } = await supportSupabaseClient.storage
      //   .from('support-attachments')
      //   .upload(prefix, file, options)

      // if (error) {
      //   console.log('error', error)
      // }
      // return data
    })
  )
}
