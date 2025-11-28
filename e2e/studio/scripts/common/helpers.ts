import assert from 'assert'
import { setTimeout } from 'timers/promises'

import { createClient } from '@supabase/supabase-js'
import { COMPUTE_MEM_SIZES, ComputeSize } from './constants.js'
import { CONFIG } from './config.js'
import { getMiddlewareClient, PlatformClient, platformClientV0 } from './platform.js'
import { decryptString } from './crypto.js'
import { components } from 'api-types'

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
      const statusResp = await platformClient.send(`/projects/${ref}/status`, {}, undefined, 0)
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

export async function waitForStorageReady(endpoint: string, serviceKey: string, sleepSecs = 75) {
  await sleep(sleepSecs * 1000)
  let successfulStorageCalls = 0
  for (let i = 0; i < 30; i++) {
    try {
      const supabase = createClient(endpoint, serviceKey)
      const { error: errList } = await supabase.storage.listBuckets()
      assert(errList == null)
      successfulStorageCalls++
      if (successfulStorageCalls == 10) {
        break
      }
      await sleep(200)
    } catch {
      await sleep(3000)
    }
  }
}

export const getComputeMemSize = (size: ComputeSize) => {
  return COMPUTE_MEM_SIZES[size]
}

export const getSupabaseAdminKey = async (ref: string) => {
  if (!CONFIG.MW_ENABLED) {
    return 'mwNotEnabled'
  }

  const middlewareClient = await getMiddlewareClient()
  const { data, error } = await middlewareClient
    .from('projects')
    .select('api_key_supabase_encrypted')
    .eq('ref', ref)
    .single()
  if (error) {
    console.log('error fetching project')
    console.log(error)
    throw error
  }
  if (!data) {
    throw new Error(`project ${ref} not found`)
  }
  return decryptString(data.api_key_supabase_encrypted as string)
}

/**
 * generates a random integer in the range min to max inclusive;
 * optionally excludes a list of integers in `butNot`
 */
export const getRandomInt = (min: number, max: number, butNot?: number[]): number => {
  const rand = Math.floor(Math.random() * (max - min + 1) + min)
  if (butNot && butNot.includes(rand)) {
    return getRandomInt(min, max, butNot)
  }
  return rand
}

export const waitUntil = async <T>(
  fnToCheck: () => T | Promise<T>,
  fnToTestSuccess: (arg: T) => boolean | Promise<boolean>,
  retry: { count: number; delay: number }
): Promise<boolean> => {
  for (let i = 0; i < retry.count; i++) {
    const result = await fnToCheck()
    if (await fnToTestSuccess(result)) {
      return true
    }
    await sleep(retry.delay)
  }
  return false
}

export const getCurrentAmiVersion = async (ref: string): Promise<string> => {
  const projectData = await getProjectByRef(ref)
  return projectData.dbVersion as string
}

export const getProjectByRef = async (
  ref: string
): Promise<components['schemas']['ProjectDetailResponse']> => {
  const projectData = await platformClientV0.send(`/projects/${ref}`)
  if (projectData.status !== 200) {
    console.log(`Failed to get project data ${projectData.statusText} ${projectData.status}`)
    throw new Error(`Failed to get project data ${projectData.statusText} ${projectData.status}`)
  }
  const projectDataJson = await projectData.json()
  return projectDataJson
}

export const removePgExtensions = async (ref: string, extensionsToRemove: string[]) => {
  const projectData = await getProjectByRef(ref)
  const encryptedConnectionString = projectData.connectionString!

  // get extensions
  const res = await platformClientV0.send(`/pg-meta/${ref}/extensions`, {
    headers: { 'x-connection-encrypted': encryptedConnectionString },
  })
  const extensions = (await res.json()) as {
    name: string
    schema: string | null
    default_version: string | null
    installed_version: string | null
    comment: string | null
  }[]

  const extensionsToRemoveList = extensions.filter(
    (ext) => extensionsToRemove.includes(ext.name) && ext.installed_version
  )

  // remove extensions
  for (const ext of extensionsToRemoveList) {
    console.log(`removing extension ${ext.name} ${ext.installed_version} ...`)
    const res = await platformClientV0.send(`/pg-meta/${ref}/extensions?id=${ext.name}`, {
      method: 'DELETE',
      headers: { 'x-connection-encrypted': encryptedConnectionString },
    })
    if (res.status !== 200) {
      console.log(`Failed to remove extension ${ext.name} ${res.statusText} ${res.status}`)
      throw new Error(`Failed to remove extension ${ext.name} ${res.statusText} ${res.status}`)
    }
  }
}

export const pgMetaQuery = async (ref: string, query: string) => {
  const projectData = await getProjectByRef(ref)
  const encryptedConnectionString = projectData.connectionString!
  const res = await platformClientV0.send(`/pg-meta/${ref}/query`, {
    method: 'POST',
    headers: { 'x-connection-encrypted': encryptedConnectionString },
    body: { query },
  })

  if (!res.ok) {
    throw new Error(`Failed to run query ${query} ${res.statusText} ${res.status}`)
  }
  return res.json()
}

export const isK8sCloudProvider = (cloudProvider: string | undefined) => {
  return cloudProvider === 'AWS_K8S' || cloudProvider === 'AWS_NIMBUS'
}
