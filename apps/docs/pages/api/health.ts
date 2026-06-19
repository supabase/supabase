import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const services = {
      database: false,
      auth: false,
      realtime: false,
      storage: false,
      vector: false,
    }

    // Check database
    try {
      const { error } = await supabase.from('_health_check').select('*').limit(1)
      services.database = !error
    } catch (error) {
      services.database = false
    }

    // Check auth
    try {
      const { error } = await supabase.auth.getUser()
      services.auth = !error
    } catch (error) {
      services.auth = false
    }

    // Check storage
    try {
      const { error } = await supabase.storage.listBuckets()
      services.storage = !error
    } catch (error) {
      services.storage = false
    }

    // Check vector (via pgvector extension)
    try {
      const { error } = await supabase.rpc('vector_health_check')
      services.vector = !error
    } catch (error) {
      services.vector = false
    }

    // Check realtime
    try {
      // Realtime health check via a simple query to the realtime schema
      const { error } = await supabase.from('realtime').select('id').limit(1)
      services.realtime = !error
    } catch (error) {
      services.realtime = false
    }

    const healthy = Object.values(services).every((service) => service)

    res.status(200).json({
      healthy,
      services,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      healthy: false,
      services: {
        database: false,
        auth: false,
        realtime: false,
        storage: false,
        vector: false,
      },
      timestamp: new Date().toISOString(),
    })
  }
}