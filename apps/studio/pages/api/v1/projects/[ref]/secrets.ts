import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

const ENV_FILE_PATH = '/opt/supabase/docker/.env'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query

  if (req.method === 'GET') {
    // In self-hosted, secrets are often just ENV vars.
    // We can return a mock or try to read from .env
    return res.status(200).json([
      { name: 'EXAMPLE_SECRET', value: '********', updated_at: new Date().toISOString() }
    ])
  }

  if (req.method === 'POST') {
    const { name, value } = req.body
    if (!name || !value) return res.status(400).json({ message: 'Name and value required' })

    // Update .env file
    try {
      let envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8')
      const regex = new RegExp(`^${name}=.*`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${name}=${value}`)
      } else {
        envContent += `\n${name}=${value}`
      }
      fs.writeFileSync(ENV_FILE_PATH, envContent.trim() + '\n', 'utf-8')
      return res.status(200).json({ name, updated_at: new Date().toISOString() })
    } catch (e) {
      return res.status(500).json({ message: 'Failed to update .env' })
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' })
}
