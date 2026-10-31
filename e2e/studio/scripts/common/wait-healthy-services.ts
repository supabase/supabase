import assert from 'assert'

import { PlatformClient } from './platform.js'
import { sleep } from './helpers.js'

const checkHealth = async (platformClient: PlatformClient, ref: string) => {
  // get health of services
  const healthResp = await platformClient.send(
    `/v1/projects/${ref}/health?services=db,pooler,auth,realtime,rest,storage`
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

export const waitForHealthyServices = async (platformClient: PlatformClient, ref: string) => {
  // check health 600 times every 2 seconds; 20mins
  for (let i = 0; i < 600; i++) {
    try {
      const health = await checkHealth(platformClient, ref)
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
