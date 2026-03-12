import type { ProductMenuGroup, SubMenuSection } from './ProductMenu.types'

export function convertSectionsToProductMenu(sections: SubMenuSection[]): ProductMenuGroup[] {
  return sections.map((section) => ({
    key: section.key,
    title: section.heading,
    items: section.links.map((link) => ({
      key: link.key,
      name: link.label,
      url: link.href ?? '#',
    })),
  }))
}
