// for internal supabase use only
const fs = require('fs/promises')
const { existsSync } = require('fs')
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager')
const { parseArgs } = require('node:util')
const assert = require('assert')

// --------------------------------------------
// Argument parsing
// --------------------------------------------
const args = parseArgs({
  options: {
    secretName: { type: 'string', short: 'n' },
    region: { type: 'string', short: 'r' },
  },
})

const secretName = args.values.secretName
const region = args.values.region || 'ap-southeast-2'

assert(secretName, 'secretName is required')

// --------------------------------------------
// Fetch secrets from AWS Secrets Manager
// --------------------------------------------
const getSecrets = async (name, region) => {
  try {
    console.info(`🔍 Fetching secrets "${name}" from region "${region}"...`)

    const secretsmanager = new SecretsManagerClient({ region })
    const command = new GetSecretValueCommand({ SecretId: name })

    const data = await secretsmanager.send(command)

    if (!data.SecretString) {
      throw new Error('SecretString response is empty')
    }

    const parsed = JSON.parse(data.SecretString)

    if (!Object.keys(parsed).length) {
      throw new Error('Secret payload is empty')
    }

    console.info(`✅ Successfully fetched ${Object.keys(parsed).length} secrets`)
    return parsed
  } catch (err) {
    console.error('❌ Error fetching secrets:', err.message)
    process.exit(1)
  }
}

// --------------------------------------------
// Write to .env.local safely
// --------------------------------------------
const writeEnvFile = async (secrets) => {
  try {
    const envPath = '.env.local'

    // warn if overwriting existing file
    if (existsSync(envPath)) {
      console.warn('⚠️  .env.local already exists and will be overwritten.')
    }

    let secretContent = ''
    for (const [key, value] of Object.entries(secrets)) {
      secretContent += `${key}="${value}"\n`
    }

    await fs.writeFile(envPath, secretContent.trim(), 'utf8')
    console.info(`📄 Wrote secrets to ${envPath}`)

  } catch (error) {
    console.error('❌ Failed to write .env.local:', error.message)
    process.exit(1)
  }
}

// --------------------------------------------
// MAIN
// --------------------------------------------
;(async () => {
  const secrets = await getSecrets(secretName, region)
  await writeEnvFile(secrets)
  console.info('🎉 Done.')
})()
