import { createClient } from '@supabase/supabase-js'
import { IS_PLATFORM } from '../constants'

let readOnly: any

if (IS_PLATFORM) {
  readOnly = createClient(process.env.READ_ONLY_URL ?? '', process.env.READ_ONLY_API_KEY ?? '')
  const readOnlyErrMessage = Error('This client is for read-only actions. Use readWrite instead.')

  // overwrites function calls
  // for readOnly
  readOnly.from('').insert = () => {
    throw readOnlyErrMessage
  }
  readOnly.from('').delete = () => {
    throw readOnlyErrMessage
  }
  readOnly.from('').update = () => {
    throw readOnlyErrMessage
  }
  readOnly.rpc = () => {
    throw readOnlyErrMessage
  }
}

export { readOnly }
