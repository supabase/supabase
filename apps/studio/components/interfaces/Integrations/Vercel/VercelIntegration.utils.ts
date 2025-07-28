export function isVercelUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'vercel.com'
  } catch {
    // If the URL is invalid, return false
    return false
  }
}
