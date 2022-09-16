// Original source: https://github.com/supabase/gotrue-js/blob/dc6cf10dcac016ba4831efdb9b8683bda109dab0/src/lib/helpers.ts#L11
export function getParameterByName(name: string, url?: string) {
  if (!url) url = window.location.href
  name = name.replace(/[[]]/g, '\\$&')
  const regex = new RegExp('[?&#]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
