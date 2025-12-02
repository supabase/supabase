import assert from 'assert'
import { faker } from '@faker-js/faker'

import { waitForProjectStatus } from '../common/helpers.js'
import { waitForHealthyServices } from '../common/wait-healthy-services.js'
import { PlatformClient } from '../common/platform.js'

export interface CreateProjectParams {
  platformClient: PlatformClient
  orgSlug: string
  supaRegion: string
  projectName: string
}

export async function createProject({
  platformClient,
  orgSlug,
  supaRegion,
  projectName,
}: CreateProjectParams): Promise<string> {
  const dbPass = faker.internet.password()

  const createResp = await platformClient.send(
    `/v1/projects`,
    {
      method: 'POST',
      body: {
        organization_slug: orgSlug,
        name: projectName,
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

export interface GetProjectRefParams {
  platformClient: PlatformClient
  orgSlug: string
  supaRegion: string
  projectName: string
}

export async function getProjectRef({
  platformClient,
  orgSlug,
  supaRegion,
  projectName,
}: GetProjectRefParams): Promise<string> {
  const getResp = await platformClient.send(`/v1/projects`, { method: 'GET' }, 60000)

  if (getResp.status != 200) {
    console.error('could not fetch projects')
    console.error(await getResp.text())
  }
  assert(getResp.status == 200, getResp.statusText)

  const projects = await getResp.json()

  const project = projects.find(
    (p: any) => p.organization_slug === orgSlug && p.region === supaRegion && p.name === projectName
  )

  if (!project) {
    throw new Error(
      `Project not found with name: ${projectName}, org: ${orgSlug}, region: ${supaRegion}`
    )
  }

  return project.ref
}
