import { navData as SolutionsData } from 'data/Solutions'
import Link from 'next/link'
import {
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

import { MenuAside } from './MenuAside'

type LinkProps = {
  text: string
  name?: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

type SolutionsColumn = (typeof SolutionsData)['navigation'][number]

export const SolutionsDropdown = () => {
  const { navigation } = SolutionsData

  return (
    <TopNavMenuPanel
      className="section-container"
      aside={
        <MenuAside>
          <SolutionsGroup column={navigation[3]} />
        </MenuAside>
      }
    >
      {navigation.slice(0, 3).map((column) => (
        <SolutionsGroup key={column.label} column={column} />
      ))}
    </TopNavMenuPanel>
  )
}

const SolutionsGroup = ({ column }: { column: SolutionsColumn }) => (
  <TopNavMenuGroup label={column.label}>
    {column.links.map(({ icon: Icon, ...link }: LinkProps) => (
      <TopNavMenuGroupLink key={link.text} linkAs={Link} href={link.url!}>
        {link.name ? (
          <>
            <span>{link.text.replace(link.name, '').trim()}</span>
            {Icon && <Icon className="size-4" strokeWidth={1.3} />}
            <span>{link.name}</span>
          </>
        ) : (
          <>
            {Icon && <Icon className="size-4" strokeWidth={1.3} />}
            <span>{link.text}</span>
          </>
        )}
      </TopNavMenuGroupLink>
    ))}
  </TopNavMenuGroup>
)
