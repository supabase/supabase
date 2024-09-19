import type { User } from '@supabase/supabase-js'
import * as configcat from 'configcat-js'

let client: configcat.IConfigCatClient

function getClient() {
  if (client) {
    return client
  }

  client = configcat.getClient(
    process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
    configcat.PollingMode.AutoPoll,
    { pollIntervalSeconds: 600 }
  )

  return client
}

export async function getFlags(user?: User) {
  return getClient().getAllValuesAsync(new configcat.User(user?.email ?? ''))
}
