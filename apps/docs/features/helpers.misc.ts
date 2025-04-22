export function nanoId(length?: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const l = length || 12
  let id = ''
  for (let i = 0; i < l; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
