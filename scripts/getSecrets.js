// for internal supabase use only
const fs = require('fs/promises')
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager')
const { parseArgs } = require('node:util')
const assert = require('assert')

const args = parseArgs({
  options: {
    secretName: { type: 'string', short: 'n' },
  },
})

const secretName = args.values.secretName
assert(secretName, 'secretName is required')

const region = 'ap-southeast-2'

const getSecrets = async (name, region) => {
  try {
    const secretsmanager = new SecretsManagerClient({ region })

    const command = new GetSecretValueCommand({
      SecretId: name,
    })
    const data = await secretsmanager.send(command)

    if (!data.SecretString) {
      throw new Error('Secrets not found')
    }
    return JSON.parse(data.SecretString)
  } catch (err) {
    console.log('Error getting secrets', err)
  }
}

// gets secrets from secrets manager and writes it to .env.local file
getSecrets(secretName, region).then(async (secrets) => {
  let secretContent = ''
  for (const [secretKey, secretValue] of Object.entries(secrets)) {
    secretContent += `${secretKey}="${secretValue}"\n`
  }
  await fs.writeFile('.env.local', secretContent.trim())
})
