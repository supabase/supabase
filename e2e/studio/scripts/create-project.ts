import '@dotenvx/dotenvx/config'

import assert from 'assert'
import fs from 'fs'
import { faker } from '@faker-js/faker'

import { getCurrentAmiVersion, waitForProjectStatus } from './common/helpers.js'
import { waitForHealthyServices } from './wait-healthy-services.js'
import { platformClientV0 } from './common/platform.js'

const apiKey = process.env.SUPA_V0_KEY
assert(apiKey, 'SUPA_V0_KEY is not set')
const orgSlug = process.env.ORG_SLUG

assert(orgSlug, 'ORG_SLUG is not set')
const supaRegion = process.env.SUPA_REGION || 'us-east-1'

;(async () => {
  // create project
  const dbPass = faker.internet.password()

  const createResp = await platformClientV0.send(
    `/projects`,
    {
      method: 'POST',
      body: {
        organization_slug: orgSlug,
        name: faker.internet.domainWord(),
        region_selection: {
          type: 'specific',
          code: supaRegion,
        },
        db_pass: dbPass,
        desired_instance_size: 'small',
      },
    },
    60000
  )

  if (createResp.status != 201) {
    console.error('could not create project')
    console.error(await createResp.text())
  }
  assert(createResp.status == 201, createResp.statusText)
  const project = await createResp.json()
  const ref = project.ref
  console.log(`created ${ref} ...`)
  console.log('waiting for healthy project ...')

  // wait for project to be ready
  await waitForProjectStatus('ACTIVE_HEALTHY', ref)
  console.log(`${await getCurrentAmiVersion(ref)}`)

  // wait for all services to be healthy
  console.log('waiting for healthy services ...')
  await waitForHealthyServices(ref)

  console.log(`project created: ${ref}`)
})()
