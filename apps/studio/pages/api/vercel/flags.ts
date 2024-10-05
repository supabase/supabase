import { type ApiData } from '@vercel/flags'
import type { NextApiResponse } from 'next'

export default async function handler(response: NextApiResponse<ApiData | null>) {
  return response.status(200).json({ overrideEncryptionMode: 'plaintext' })
}
