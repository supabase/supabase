export const isActiveHref = (href: string | undefined, pathname: string): boolean => {
  if (!href?.startsWith('/')) return false
  const sectionPrefix = href.split('/').slice(0, 3).join('/')
  return pathname === sectionPrefix || pathname.startsWith(`${sectionPrefix}/`)
}

export const isReferencePath = (pathname: string): boolean => isActiveHref('/reference', pathname)
