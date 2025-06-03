import * as configcat from 'configcat-js'

let client: configcat.IConfigCatClient

function getClient() {
  if (client) {
    return client
  }

  client = configcat.getClient('configcat-proxy/frontend-v2', configcat.PollingMode.AutoPoll, {
    baseUrl: process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL,
    pollIntervalSeconds: 7 * 60, // 7 minutes
  })

  return client
}

export async function getFlags(userEmail: string = '') {
  if (userEmail) {
    return getClient().getAllValuesAsync(new configcat.User(userEmail))
  }

  return []
}
