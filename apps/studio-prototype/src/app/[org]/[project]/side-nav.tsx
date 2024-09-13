import { SideNav as SideNavData } from '@/src/config/nav'
import { memo } from 'react'
import { Separator } from 'ui'
import { HoverProvider } from '../side-nav-hover-context'
import SideNavMenuIcon from '../side-nav-menu-icon'
import SideNavMotion from '../side-nav-motion'
import SideNavExtra from './side-nav-extra'

function SideNav() {
  return (
    <HoverProvider>
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
                <div key={`project-side-nav-group-${i}`} className="w-full flex flex-col gap-5">
                  {group.map((product) => (
                    <SideNavMenuIcon key={product.name} product={product} />
                  ))}
                </div>
                <Separator />
              </>
            )
          })}
          <SideNavExtra />
        </div>
      </SideNavMotion>
    </HoverProvider>
  )
}

export default memo(SideNav)
