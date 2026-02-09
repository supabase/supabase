import { useParams } from 'common'
import { IS_PLATFORM } from 'lib/constants'

import { generateToolbarItems } from './SidebarToolbar.utils'
import { ToolbarButton } from './ToolbarButton'

export const SidebarToolbar = () => {
  const { ref: projectRef } = useParams()

  // Generate toolbar items dynamically based on context
  const toolbarItems = generateToolbarItems({
    projectRef,
    isPlatform: IS_PLATFORM,
  })

  // Filter to only enabled items
  const enabledItems = toolbarItems.filter((item) => item.enabled)

  return (
    <div className="inset-x-0 bottom-0 z-40 md:z-auto bg-sidebar flex flex-col w-full md:w-[40px] md:h-full border-t md:border-l items-center">
      <div className="flex md:flex-col items-center justify-between md:justify-center w-full md:w-auto max-w-xs gap-2 py-2 px-4">
        {enabledItems.map((item) => (
          <ToolbarButton key={item.key} {...item.config} />
        ))}
      </div>
    </div>
  )
}
