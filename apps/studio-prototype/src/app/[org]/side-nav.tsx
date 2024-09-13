import { SideNav as SideNavData } from '@/src/config/org-nav'
import { memo } from 'react'
import { Separator } from 'ui'
import SideNavMenuIcon from './side-nav-menu-icon'
import SideNavMotion from './side-nav-motion'
import { HoverProvider } from './side-nav-hover-context'

function SideNav() {
  return (
    <HoverProvider>
      <SideNavMotion>
        <div className="grow w-full h-full flex flex-col my-5 gap-6">
          {SideNavData.map((group, i) => {
            return (
              <>
                <div key={`container-${i}`} className="w-full flex flex-col gap-5">
                  {group.map((product) => (
                    <SideNavMenuIcon key={`${product.name}-${i}`} product={product} />
                  ))}
                </div>
                <Separator />
              </>
            )
          })}
        </div>
      </SideNavMotion>
    </HoverProvider>
  )
}

export default memo(SideNav)
