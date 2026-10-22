export function getAuthRedirectSearch(pathname: string, search: string, hash: string) {
  const params = new URLSearchParams(search)
  params.set('returnTo', `${pathname}${search}${hash}`)
  return params.toString()
}
