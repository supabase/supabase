import assert from 'assert'
import { faker } from '@faker-js/faker'

import { waitForProjectStatus } from './common/helpers.js'
import { waitForHealthyServices } from './common/wait-healthy-services.js'
import { PlatformClient } from './common/platform.js'

export async function createProject(
  platformClient: PlatformClient,
  orgSlug: string,
  supaRegion: string
) {
  const dbPass = faker.internet.password()

  const createResp = await platformClient.send(
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
  await waitForProjectStatus({ platformClient, ref, expectedStatus: 'ACTIVE_HEALTHY' })

  // wait for all services to be healthy
  console.log('waiting for healthy services ...')
  await waitForHealthyServices(platformClient, ref)

  console.log(`project created: ${ref}`)
  return ref
}
