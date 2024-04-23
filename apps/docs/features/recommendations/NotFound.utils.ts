const notFoundLink = (origPath: string) => {
  if (!origPath) return '/not-found'

  const searchParams = new URLSearchParams({ page: origPath })
  return `/not-found?${searchParams}`
}

export { notFoundLink }
