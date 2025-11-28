import assert from 'assert'
import { setTimeout } from 'timers/promises'

import { CONFIG } from './config.js'
import { PlatformClient } from './platform.js'

const statusWaiterMilliSeconds = parseInt(process.env.STATUS_WAITER_MILLI_SECONDS ?? '3000')
const statusWaiterRetries = parseInt(
  process.env.STATUS_WAITER_RETRIES ?? `${900_000 / statusWaiterMilliSeconds}`
)

export const sleep = (ms: number) => setTimeout(ms)

export async function waitForProjectStatus(
  expectedStatus: string,
  ref: string,
  retries = statusWaiterRetries
) {
  const platformClient = new PlatformClient({
    url: CONFIG.SUPA_PLATFORM_URI,
    accessToken: CONFIG.SUPA_V0_KEY,
  })

  for (let i = 0; i < retries; i++) {
    try {
      const statusResp = await platformClient.send(`/projects/${ref}`, {}, undefined, 0)
      if (statusResp.status != 200) {
        console.log(
          `Failed to get project status ${statusResp.statusText} ${
            statusResp.status
          } ${await statusResp.text()}`
        )
      }
      assert(statusResp.status == 200)
      const { status } = await statusResp.json()
      assert(status == expectedStatus)
      return
    } catch {
      await sleep(statusWaiterMilliSeconds)
    }
  }
  throw new Error(
    `did not reach expected status ${expectedStatus} after retries ${retries} x ${statusWaiterMilliSeconds}ms`
  )
}
