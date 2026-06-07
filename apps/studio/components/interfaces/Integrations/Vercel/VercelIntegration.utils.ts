export function isVercelUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'vercel.com'
  } catch {
    // If the URL is invalid, return false
    return false
  }
}
