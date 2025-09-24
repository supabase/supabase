import { IS_PLATFORM } from 'common'
import { DEFAULT_MCP_URL_NON_PLATFORM, DEFAULT_MCP_URL_PLATFORM } from '../constants'

export function getMcpBaseUrl(isPlatform: boolean): string {
  //  If running in platform, use API_URL from the env var
  if (isPlatform) return process.env.NEXT_PUBLIC_MCP_URL ?? DEFAULT_MCP_URL_PLATFORM
  // If running self-hosted Vercel preview, use VERCEL_URL
  if (!!process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/mcp`
  // If running on self-hosted, use NEXT_PUBLIC_SITE_URL or fallback
  if (!!process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/mcp`
  return DEFAULT_MCP_URL_NON_PLATFORM
}
