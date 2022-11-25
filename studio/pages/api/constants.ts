const PUBLIC_URL = new URL(process.env.SUPABASE_PUBLIC_URL || 'https://localhost:8443')

export const PROJECT_REST_URL = `${PUBLIC_URL.origin}/rest/v1/`
export const PROJECT_ENDPOINT = PUBLIC_URL.host
