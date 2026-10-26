import { createTool as createGetActiveIncidentsTool } from './get-active-incidents.server'
import type { ToolContext } from './types'

/**
 * @param baseUrl - The base URL for API requests (e.g., https://supabase.com/dashboard)
 *                  This should be the public URL to leverage CDN caching.
 */
export const getIncidentTools = ({ baseUrl, ...ctx }: ToolContext & { baseUrl: string }) => ({
  get_active_incidents: createGetActiveIncidentsTool({ ...ctx, baseUrl }),
})
