export function getPageType(asPath: string) {
  let page
  switch (asPath) {
    case '/guides':
    case '/guides/local-development':
    case /\/guides\/[a-zA-Z]*\/[a-zA-Z\-]*/.test(asPath) && asPath:
      page = 'Guides'
      break
    case asPath.includes('/reference') && asPath:
      page = 'Reference'
      break
    default:
      page = 'Docs'
      break
  }

  return page
}
