import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// In a real environment, this would point to the mounted /opt/supabase/docker/.env
// For this professional demonstration, we simulate updating the .env file.
const ENV_FILE_PATH = process.env.LOCAL_ENV_PATH || '/opt/supabase/docker/.env'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const config = req.body

    // 1. Read existing .env
    let envContent = ''
    try {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8')
    } catch (e) {
      console.warn('Could not read existing .env file at', ENV_FILE_PATH)
    }

    // 2. Parse existing keys
    const lines = envContent.split('\n')
    const updateLine = (key: string, value: string | boolean | number) => {
      const regex = new RegExp(`^${key}=.*`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        envContent += `\n${key}=${value}`
      }
    }

    // 3. Map GoTrue config from UI to your Self-Hosted Env Vars
    if (config.EXTERNAL_GOOGLE_ENABLED !== undefined) {
      updateLine('GOOGLE_ENABLED', config.EXTERNAL_GOOGLE_ENABLED)
    }
    if (config.EXTERNAL_GOOGLE_CLIENT_ID !== undefined) {
      updateLine('GOOGLE_CLIENT_ID', config.EXTERNAL_GOOGLE_CLIENT_ID)
    }
    if (config.EXTERNAL_GOOGLE_SECRET !== undefined) {
      updateLine('GOOGLE_SECRET', config.EXTERNAL_GOOGLE_SECRET)
    }
    if (config.EXTERNAL_GITHUB_ENABLED !== undefined) {
      updateLine('GITHUB_ENABLED', config.EXTERNAL_GITHUB_ENABLED)
    }
    if (config.EXTERNAL_GITHUB_CLIENT_ID !== undefined) {
      updateLine('GITHUB_CLIENT_ID', config.EXTERNAL_GITHUB_CLIENT_ID)
    }
    if (config.EXTERNAL_GITHUB_SECRET !== undefined) {
      updateLine('GITHUB_SECRET', config.EXTERNAL_GITHUB_SECRET)
    }
    if (config.SMTP_HOST !== undefined) {
      updateLine('SMTP_HOST', config.SMTP_HOST)
    }
    if (config.SMTP_PORT !== undefined) {
      updateLine('SMTP_PORT', config.SMTP_PORT)
    }
    if (config.SMTP_USER !== undefined) {
      updateLine('SMTP_USER', config.SMTP_USER)
    }
    if (config.SMTP_PASS !== undefined) {
      updateLine('SMTP_PASS', config.SMTP_PASS)
    }
    if (config.DISABLE_SIGNUP !== undefined) {
      updateLine('DISABLE_SIGNUP', config.DISABLE_SIGNUP)
    }

    // 4. Write back to .env
    try {
      fs.writeFileSync(ENV_FILE_PATH, envContent.trim() + '\n', 'utf-8')
    } catch (e) {
      console.error('Failed to write .env file', e)
      return res.status(500).json({ message: 'Failed to write to .env file due to permissions.' })
    }

    // Return the updated config as expected by the UI
    return res.status(200).json(config)
  } catch (error) {
    console.error('Config update error:', error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}
