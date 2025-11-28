import assert from 'assert'
import fs from 'fs'
import dotenv from 'dotenv'
import { faker } from '@faker-js/faker'

import {
  getCurrentAmiVersion,
  getSupabaseAdminKey,
  waitForProjectStatus,
} from './common/helpers.js'
import { waitForHealthyServices } from './wait-healthy-services.js'
import { platformClientV0 } from './common/platform.js'

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const apiKey = process.env.SUPA_V0_KEY
assert(apiKey, 'SUPA_V0_KEY is not set')
const orgSlug = process.env.ORG_SLUG
assert(orgSlug, 'ORG_SLUG is not set')
const cloudProvider = process.env.CLOUD_PROVIDER || 'AWS'
const postgresVersionTag = process.env.POSTGRES_VERSION_TAG
const supaRegion = process.env.SUPA_REGION || 'Southeast Asia (Singapore)'
const outputFile = process.env.OUTPUT_FILE || '.env'
const projectFile = process.env.PROJECT_JSON || 'project.json'

console.log(`RELEASE_CHANNEL: ${process.env.RELEASE_CHANNEL}`)
console.log(`POSTGRES_ENGINE: ${process.env.POSTGRES_ENGINE}`)
console.log(`TARGET_RELEASE_CHANNEL: ${process.env.TARGET_RELEASE_CHANNEL}`)
console.log(`TARGET_POSTGRES_ENGINE: ${process.env.TARGET_POSTGRES_ENGINE}`)

const getUserEmail = async (): Promise<string> => {
  const membersRes = await platformClientV0.send(`/organizations/${orgSlug}/members`)
  // const profileRes = await platformClientV0.send(`/profile`)
  const members = await membersRes.json()
  return members[0].primary_email
}

;(async () => {
  // create project
  const dbPass = faker.internet.password()

  // env var can be set to '' hence using || instead of ??
  // FLY doesn't support release channel and postgres engine, silently fallback to default
  const releaseChannel =
    cloudProvider !== 'FLY' ? process.env.RELEASE_CHANNEL || undefined : undefined
  const postgresEngine =
    cloudProvider !== 'FLY' ? process.env.POSTGRES_ENGINE || undefined : undefined

  const createResp = await platformClientV0.send(
    `/projects`,
    {
      method: 'POST',
      body: {
        cloud_provider: cloudProvider,
        organization_slug: orgSlug,
        name: faker.internet.domainWord(),
        db_pass: dbPass,
        db_region: supaRegion,
        db_pricing_tier_id: 'tier_free',
        desired_instance_size: process.env.CREATE_PROJECT_SIZE,
        postgres_engine: postgresEngine,
        release_channel: releaseChannel,
        custom_supabase_internal_requests: postgresVersionTag
          ? { ami: { search_tags: { 'tag:postgresVersion': postgresVersionTag } } }
          : undefined,
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

  const res = await platformClientV0.send(`/projects/${ref}/config/supavisor`)
  const supavisorDbHost: string = (await res.json()).find(
    (d: Record<string, string>) => d.database_type === 'PRIMARY'
  ).db_host

  console.log(`supavisor db host: ${supavisorDbHost}`)

  // save project body to file
  project.db_pass = dbPass
  project.apiKey = apiKey
  fs.writeFileSync(projectFile, JSON.stringify(project, null, 2))
  fs.writeFileSync(
    outputFile,
    `SUPABASE_DB_HOST=${supavisorDbHost}
SUPABASE_DB_PORT=6543
SUPABASE_DB_USER=postgres.${ref}
SUPABASE_DB_PASS=${dbPass}
SUPABASE_GOTRUE=${project.endpoint}/auth/v1
SUPABASE_URL=${project.endpoint}
SUPABASE_KEY_ANON=${project.anon_key}
SUPABASE_KEY_ADMIN=${project.service_key}
SUPABASE_PROJECT_REF=${ref}
ACCESS_TOKEN=${apiKey}
SUPABASE_ADMIN_KEY=${await getSupabaseAdminKey(ref)}
PRIMARY_EMAIL=${await getUserEmail()}
`
  )

  // update project auth settings to skip email verification as it may cause unnecessary flakiness
  const patchResp = await platformClientV0.send(
    `/auth/${ref}/config`,
    {
      method: 'PATCH',
      body: {
        // tune email login to not require email verification
        EXTERNAL_EMAIL_ENABLED: true,
        MAILER_AUTOCONFIRM: true,
        MAILER_SECURE_EMAIL_CHANGE_ENABLED: true,
        MAILER_OTP_EXP: 86400,
        PASSWORD_MIN_LENGTH: 6,
        // phone login enable, confirm is disabled
        EXTERNAL_PHONE_ENABLED: false,
        SMS_PROVIDER: 'twilio',
        SMS_TWILIO_ACCOUNT_SID: ' ',
        SMS_TWILIO_AUTH_TOKEN: ' ',
        SMS_TWILIO_MESSAGE_SERVICE_SID: ' ',
        SMS_AUTOCONFIRM: true,
        SMS_OTP_EXP: 60,
        SMS_OTP_LENGTH: 6,
        SMS_TEMPLATE: 'Your code is {{ .Code }}',
        // we were hitting rate limits at default of 30 during our tests
        // this is used for signups and signins
        RATE_LIMIT_OTP: 50,
      },
    },
    15000
  )
  if (patchResp.status != 200) {
    console.log(patchResp.status, patchResp.statusText)
    console.log(await patchResp.text())
    console.log('could not patch auth config')
  }

  console.log('waiting for healthy services ...')
  // wait for all services to be healthy
  await waitForHealthyServices(ref)

  console.log(`project created:`)
  console.log(ref)
})()
