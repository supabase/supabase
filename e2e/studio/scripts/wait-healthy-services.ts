import assert from 'assert'

import { PlatformClient } from './common/platform.js'
import { sleep } from './common/helpers.js'

import { CONFIG } from './common/config.js'

const checkHealth = async (ref: string) => {
  const platformClient = new PlatformClient({
    url: CONFIG.SUPA_PLATFORM_URI_V1,
    accessToken: CONFIG.SUPA_V1_KEY,
  })

  // get health of services
  const healthResp = await platformClient.send(
    `/projects/${ref}/health?services=db,pooler,auth,realtime,rest,storage`
  )

  assert(
    healthResp.status == 200,
    `Failed to get health ${healthResp.status}: ${healthResp.statusText}`
  )

  const health = await healthResp.json()

  return health as Health[]
}

type Health = {
  name: string
  healthy: boolean
  status: string
  info?: unknown
  error?: unknown
}

export const waitForHealthyServices = async (ref: string) => {
  // check health 600 times every 2 seconds; 20mins
  for (let i = 0; i < 600; i++) {
    try {
      const health = await checkHealth(ref)
      // check if all services are healthy
      if (health.every((h) => h.healthy)) {
        return
      }
      console.log(`waiting ${i} ... services: ${JSON.stringify(health.filter((h) => !h.healthy))}`)
    } catch (e) {
      console.log(`waiting ${i} ... errored: ${(e as { message: string }).message}`)
    }

    await sleep(2000)
  }
  throw new Error('Services are not healthy')
}
