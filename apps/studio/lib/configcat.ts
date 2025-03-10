import * as configcat from 'configcat-js'

let client: configcat.IConfigCatClient

function getClient() {
  if (client) {
    return client
  }

  client = configcat.getClient(
    process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
    configcat.PollingMode.AutoPoll,
    { pollIntervalSeconds: 7 * 60 } // 7 minutes
  )

  return client
}

export async function getFlags(userEmail: string = '') {
  if (userEmail) {
    return getClient().getAllValuesAsync(new configcat.User(userEmail))
  }

  return []
}
