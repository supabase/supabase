import { NextApiRequest, NextApiResponse } from 'next'
import { getConnectionStringForRef } from '@/lib/api/self-hosted/util'
import { getAllDatabases } from '@/lib/api/self-hosted/registry'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = req.query.ref as string || 'todo-app'
  const conn = getConnectionStringForRef(ref)
  const dbs = getAllDatabases()
  res.json({ conn, dbs: dbs.map(d => ({ref: d.ref, host: d.host})), cwd: process.cwd(), env: process.env.DATABASE_REGISTRY_PATH })
}
