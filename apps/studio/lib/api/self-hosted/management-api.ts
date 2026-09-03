import { NextApiRequest, NextApiResponse } from 'next'

const MANAGEMENT_API_URL = process.env.MANAGEMENT_API_URL
const MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN

export const IS_MANAGEMENT_API_ENABLED = Boolean(MANAGEMENT_API_URL && MANAGEMENT_API_TOKEN)

export async function proxyManagementApi(req: NextApiRequest, res: NextApiResponse, path: string) {
  if (!MANAGEMENT_API_URL || !MANAGEMENT_API_TOKEN) {
    return res.status(404).json({
      error: {
        message:
          'Management API is not configured. Set MANAGEMENT_API_URL and MANAGEMENT_API_TOKEN on the studio container.',
      },
    })
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const response = await fetch(`${MANAGEMENT_API_URL}${path}`, {
    method: req.method,
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
    },
    body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
  })

  const body = await response.json().catch(() => null)
  return res.status(response.status).json(body)
}
