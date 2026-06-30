import { navDataForMdx } from '../../components/Navigation/NavigationMenu/NavigationMenu.constants'
import { withDocsBasePath } from '../internal-links'

type NavItem = { name?: string; url?: string }

export const NavData = ({ props }: { props: Record<string, unknown> }): string => {
  const dataset = navDataForMdx[props.data as keyof typeof navDataForMdx]
  if (!dataset) return ''

  // Datasets are either a flat array of items or a section with an `items` list.
  const items: NavItem[] = Array.isArray(dataset) ? dataset : (dataset.items ?? [])
  return items
    .filter((item) => item.url)
    .map((item) => `- [${item.name}](${withDocsBasePath(String(item.url))})`)
    .join('\n')
}
