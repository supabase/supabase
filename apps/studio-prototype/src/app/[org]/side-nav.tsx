import SideNavMenuIcon from './side-nav-menu-icon'
import UserMenu from './user-menu'
import { SideNav as SideNavData } from '@/src/config/nav'
import SideMenuOrgMenu from './side-menu-org-menu'
import SideNavMotion from './side-nav-motion'
import React, { memo } from 'react'
import { Separator } from 'ui'

function SideNav() {
  return (
    <SideNavMotion>
      <SideMenuOrgMenu />
      <div className="grow w-full flex flex-col my-6 gap-6">
        {SideNavData.map((group, i) => {
          return (
            <>
              <div key={i} className="w-full flex flex-col gap-5">
                {group.map((product) => (
                  <SideNavMenuIcon key={product.name} product={product} />
                ))}
              </div>
              <Separator />
            </>
          )
        })}
      </div>
      <UserMenu />
    </SideNavMotion>
  )
}

export default memo(SideNav)
