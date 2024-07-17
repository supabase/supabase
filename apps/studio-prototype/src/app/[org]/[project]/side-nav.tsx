import { SideNav as SideNavData } from '@/src/config/nav'
import { memo } from 'react'
import { Separator } from 'ui'
import SideMenuOrgMenu from '../side-menu-org-menu'
import SideNavMenuIcon from '../side-nav-menu-icon'
import SideNavMotion from '../side-nav-motion'
import { Box } from 'lucide-react'

function SideNav() {
  return (
    <div className="w-16 h-full">
      <SideNavMotion>
        {/* <SideMenuOrgMenu /> */}
        {/* <div className="flex justify-center w-full">
        <div className="text-[10px] uppercase flex justify-center bg-surface-200 w-full h-[37px] -top-8 items-center">
          <Box size={16} className="text-foreground-muted" strokeWidth={1} />
        </div>
      </div> */}
        {/* <Separator /> */}
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
    </div>
  )
}

export default memo(SideNav)
