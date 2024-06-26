import { cn } from 'ui'
import SideNavMenuIcon from './side-nav-menu-icon'
import UserMenu from './user-menu'
import { SideNav as SideNavData } from '@/src/config/nav'
import SideMenuOrgMenu from './side-menu-org-menu'
import SideNavMotion from './side-nav-motion'
import React, { memo } from 'react'

function SideNav() {
  return (
    <SideNavMotion>
      <SideMenuOrgMenu />
      <div className="grow w-full flex flex-col gap-5 my-6">
        {SideNavData.map((product) => (
          <SideNavMenuIcon key={product.name} product={product} />
        ))}
      </div>
      <UserMenu />
    </SideNavMotion>
  )
}

export default memo(SideNav)
