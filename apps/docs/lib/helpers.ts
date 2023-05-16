import { ICommonBase, ICommonItem, ICommonSection } from '../components/reference/Reference.types'

// menus to render in the SideBar.js (Ref Nav.constants.ts)
export function getPageType(asPath: string) {
  let page
  if (!asPath) return ''

  if (asPath.includes('/guides')) {
    page = 'docs'
  } else if (asPath.includes('/reference/javascript/v1')) {
    page = 'reference/javascript/v1'
  } else if (asPath.includes('/reference/javascript')) {
    page = 'reference/javascript'
  } else if (asPath.includes('/reference/dart/v0')) {
    page = 'reference/dart/v0'
  } else if (asPath.includes('/reference/dart')) {
    page = 'reference/dart'
  } else if (asPath.includes('/reference/api')) {
    page = 'reference/api'
  } else if (asPath.includes('/reference/cli')) {
    page = 'reference/cli'
  } else if (asPath.includes('/reference/auth')) {
    page = 'reference/auth'
  } else if (asPath.includes('/reference/realtime')) {
    page = 'reference/realtime'
  } else if (asPath.includes('/reference/storage')) {
    page = 'reference/storage'
  } else if (asPath.includes('/reference')) {
    page = 'reference'
  } else {
    page = 'docs'
  }

  return page
}

/**
 * Flattens common sections recursively by their `items`.
 *
 * _Note:_ `sections` type set to `ICommonBase[]` instead of
 * `ICommonItem[]` until TypeScript supports JSON imports as const:
 * https://github.com/microsoft/TypeScript/issues/32063
 */
export function flattenSections(sections: ICommonBase[]): ICommonSection[] {
  return sections.reduce<ICommonSection[]>((acc, section: ICommonItem) => {
    // Flatten sub-items
    if ('items' in section) {
      let newSections = acc

      if (section.type !== 'category') {
        newSections.push(section)
      }

      return newSections.concat(flattenSections(section.items))
    }
    return acc.concat(section)
  }, [])
}
