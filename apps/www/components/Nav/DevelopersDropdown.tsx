import staticContent from '.generated/staticContent/_index.json'
import { data as DevelopersData } from 'data/Developers'
import Link from 'next/link'
import {
  TopNavMenuGroup,
  TopNavMenuGroupLink,
  TopNavMenuPanel,
} from 'ui-patterns/TopNav/TopNavMenu'

import { getLinkComponent } from './MenuItem'

type LinkProps = {
  text: string
  description?: string
  url?: string
  icon?: any
  svg?: any
}

export const DevelopersDropdown = () => {
  const { jobsCount, latestBlogPosts } = staticContent

  return (
    <TopNavMenuPanel>
      {DevelopersData['navigation'].map((column) => (
        <TopNavMenuGroup key={column.label} label={column.label}>
          {column.links.map(({ icon: Icon, ...link }: LinkProps) => (
            <TopNavMenuGroupLink
              key={link.text}
              linkAs={getLinkComponent(link.url!)}
              href={link.url!}
            >
              {Icon && <Icon size={16} strokeWidth={1.3} />}
              <span>{link.text}</span>
              {link.text === 'Careers' && jobsCount > 0 && (
                <span className="text-xs text-foreground-lighter -ml-1">({jobsCount})</span>
              )}
            </TopNavMenuGroupLink>
          ))}
        </TopNavMenuGroup>
      ))}
      <TopNavMenuGroup label="Blog">
        {latestBlogPosts?.slice(0, 2).map((post: any) => (
          <TopNavMenuGroupLink
            key={post.title}
            linkAs={Link}
            href={post.url}
            className="flex-col items-start gap-1"
          >
            <span className="line-clamp-2">{post.title}</span>
            <span className="line-clamp-2 text-xs text-foreground-lighter leading-relaxed">
              {post.description}
            </span>
          </TopNavMenuGroupLink>
        ))}
      </TopNavMenuGroup>
    </TopNavMenuPanel>
  )
}
