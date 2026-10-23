export function getAuthRedirectSearch(pathname: string, search: string, hash: string) {
  return new URLSearchParams({ returnTo: `${pathname}${search}${hash}` }).toString()
}
