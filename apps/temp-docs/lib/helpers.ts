export function getPageType(asPath: string) {
  let page
  if (!asPath) return ''

  if (asPath.includes('/guides')) {
    page = 'docs'
  } else if (asPath.includes('/reference/javascript')) {
    page = 'reference/javascript'
  } else if (asPath.includes('/reference/javascript/v1')) {
    page = 'reference/javascript/v1'
  } else if (asPath.includes('/reference/dart')) {
    page = 'reference/dart'
  } else if (asPath.includes('/reference/dart/v0')) {
    page = 'reference/dart/v0'
  } else if (asPath.includes('/reference')) {
    page = 'reference'
  } else {
    page = 'docs'
  }

  return page
}
