import { SideNav as SideNavData } from '@/src/config/nav'
import { memo } from 'react'
import { Separator } from 'ui'
import SideMenuOrgMenu from './side-menu-org-menu'
import SideNavMenuIcon from './side-nav-menu-icon'
import SideNavMotion from './side-nav-motion'

function SideNav() {
  return (
    <SideNavMotion>
      {/* <SideMenuOrgMenu /> */}
      <div className="grow w-full flex flex-col my-5 gap-6">
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
    </SideNavMotion>
  )
}

export default memo(SideNav)
