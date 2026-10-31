import assert from 'assert'
import { setTimeout } from 'timers/promises'

import { PlatformClient } from './platform.js'

const statusWaiterMilliSeconds = parseInt(process.env.STATUS_WAITER_MILLI_SECONDS ?? '3000')
const statusWaiterRetries = parseInt(
  process.env.STATUS_WAITER_RETRIES ?? `${900_000 / statusWaiterMilliSeconds}`
)

export const sleep = (ms: number) => setTimeout(ms)

export type WaitForProjectStatusParams = {
  platformClient: PlatformClient
  ref: string
  expectedStatus: string
  retries?: number
}
export async function waitForProjectStatus({
  platformClient,
  ref,
  expectedStatus,
  retries = statusWaiterRetries,
}: WaitForProjectStatusParams) {
  for (let i = 0; i < retries; i++) {
    try {
      const statusResp = await platformClient.send(`/v1/projects/${ref}`, {}, undefined, 0)
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
