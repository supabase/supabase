import * as configcat from 'configcat-js'
import { fetchHandler } from 'data/fetchers'

let client: configcat.IConfigCatClient

const endpoint = '/configuration-files/configcat-proxy/frontend-v2/config_v6.json'

async function getClient() {
  if (client) {
    return client
  }

  const response = await fetchHandler(process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL + endpoint)
  const options = { pollIntervalSeconds: 7 * 60 } // 7 minutes
  if (response.status !== 200) {
    // proxy is down, use default client
    client = configcat.getClient(
      process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
      configcat.PollingMode.AutoPoll,
      options
    )
  } else {
    client = configcat.getClient('configcat-proxy/frontend-v2', configcat.PollingMode.AutoPoll, {
      ...options,
      baseUrl: process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL,
    })
  }

  return client
}

export async function getFlags(userEmail: string = '') {
  if (userEmail) {
    const client = await getClient()
    return client.getAllValuesAsync(new configcat.User(userEmail))
  }

  return []
}
