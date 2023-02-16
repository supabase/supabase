// for internal supabase use only
const fs = require('fs/promises')
const AWS = require('aws-sdk')

const secretName = 'local/studio'
const region = 'ap-southeast-2'

const getSecrets = async (name, region) => {
  try {
    AWS.config.update({ region })
    const secretsmanager = new AWS.SecretsManager()

    const data = await secretsmanager
      .getSecretValue({
        SecretId: name,
      })
      .promise()

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
