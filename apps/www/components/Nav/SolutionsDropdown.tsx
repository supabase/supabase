import { navData as SolutionsData } from 'data/Solutions'
import Link from 'next/link'
import {
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

type LinkProps = {
  text: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

export const SolutionsDropdown = () => (
  <TopNavMenuPanel>
    {SolutionsData['navigation'].map((column) => (
      <TopNavMenuGroup key={column.label} label={column.label}>
        {column.links.map(({ icon: Icon, ...link }: LinkProps) => (
          <TopNavMenuGroupLink key={link.text} linkAs={Link} href={link.url!}>
            {Icon && <Icon className="size-4" strokeWidth={1.3} />}
            <span>{link.text}</span>
          </TopNavMenuGroupLink>
        ))}
      </TopNavMenuGroup>
    ))}
  </TopNavMenuPanel>
)
