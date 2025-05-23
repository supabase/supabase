import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query
  const sql = `SELECT * FROM users WHERE username = '${username}'`
  try {
    const { data, error } = await supabase.rpc('execute_raw_sql', { sql })
    if (error) throw error
    res.status(200).json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
