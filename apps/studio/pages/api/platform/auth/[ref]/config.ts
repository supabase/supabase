import { NextApiRequest, NextApiResponse } from 'next'
import { validateProjectRef } from '@/lib/self-hosted-auth/project-registry'
import { envConfigMap, configEnvMap } from '@/lib/self-hosted-auth/config-map'
import { validateConfigUpdate } from '@/lib/self-hosted-auth/validation'
import { processSecretUpdates } from '@/lib/self-hosted-auth/secrets'
import { requestManager } from '@/lib/self-hosted-auth/manager-client'
import { IS_PLATFORM, ENABLE_SELF_HOSTED_AUTH_MENU } from '@/lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refError = validateProjectRef(req.query.ref as string)
  if (refError) {
    return res.status(400).json({ error: refError })
  }

  if (req.method === 'GET') {
    try {
      const response = await requestManager('GET', '/platform/auth/default/config')
      if (response.status !== 200) {
        return res.status(response.status).json(response.data)
      }

      const envDict = response.data.env || {}
      
      // Map env keys to Studio config keys
      const configObj: Record<string, any> = {}
      for (const [envKey, envVal] of Object.entries(envDict)) {
        const studioKey = envConfigMap[envKey]
        if (studioKey) {
          // Convert string booleans back to booleans
          if (envVal === 'true' || envVal === 'false') {
            configObj[studioKey] = envVal === 'true'
          } else {
            configObj[studioKey] = envVal
          }
        }
      }

      return res.status(200).json(configObj)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PATCH') {
    if (
      IS_PLATFORM ||
      !ENABLE_SELF_HOSTED_AUTH_MENU ||
      req.headers['content-type'] !== 'application/json' ||
      (process.env.NEXT_PUBLIC_SITE_URL && req.headers.origin !== process.env.NEXT_PUBLIC_SITE_URL)
    ) {
      return res.status(403).json({ error: 'Unauthorized configuration update' })
    }

    try {
      const payload = req.body || {}
      
      const validationErrors = validateConfigUpdate(payload)
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: validationErrors })
      }

      const processedUpdates = processSecretUpdates(payload)
      
      // Map Studio keys back to env keys
      const envUpdates: Record<string, string> = {}
      for (const [studioKey, studioVal] of Object.entries(processedUpdates)) {
        const envKey = configEnvMap[studioKey]
        if (envKey) {
          // Convert booleans to strings
          if (typeof studioVal === 'boolean') {
            envUpdates[envKey] = studioVal ? 'true' : 'false'
          } else {
            envUpdates[envKey] = String(studioVal)
          }
        }
      }

      const patchRes = await requestManager('PATCH', '/platform/auth/default/config', { env: envUpdates })
      return res.status(patchRes.status).json(patchRes.data)

    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
