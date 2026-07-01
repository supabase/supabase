export const parseRedirectMessage = (asPath: string) =>
  new URLSearchParams(asPath.split('#')[1] ?? '').get('message') ?? undefined
