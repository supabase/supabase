import { NextApiRequest, NextApiResponse } from 'next'

import { get } from 'data/fetchers'
import { handleError } from 'data/fetchers'

/**
 * API endpoint to trigger Edge Functions redeployment
 * This is called when secrets are updated to ensure Edge Functions
 * pick up the new environment variables
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { projectRef, functionSlug } = req.body

    if (!projectRef) {
      return res.status(400).json({ error: 'projectRef is required' })
    }

    // Get the current function details
    const { data: functionDetails, error: fetchError } = await get(
      `/v1/projects/{ref}/functions/{slug}`,
      {
        params: { path: { ref: projectRef, slug: functionSlug } },
      }
    )

    if (fetchError) {
      handleError(fetchError)
      return res.status(500).json({ error: 'Failed to fetch function details' })
    }

    // Trigger redeployment by calling the deploy endpoint with current function data
    const { data: deployData, error: deployError } = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/v1/projects/${projectRef}/functions/deploy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          slug: functionSlug,
          metadata: functionDetails.metadata,
          // The function files will be fetched from the existing deployment
        }),
      }
    ).then((res) => res.json())

    if (deployError) {
      return res.status(500).json({ error: 'Failed to redeploy function' })
    }

    return res.status(200).json({
      message: 'Edge Function redeployed successfully',
      data: deployData,
    })
  } catch (error) {
    console.error('Error redeploying Edge Function:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 