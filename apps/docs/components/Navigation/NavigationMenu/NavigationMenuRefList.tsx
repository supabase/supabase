import { useCommonSections, useSpec } from './NavigationMenu.utils'
import NavigationMenuRefListItems from './NavigationMenuRefListItems'

import React from 'react'

interface NavigationMenuRefListProps {
  id: string
  basePath: string
  commonSectionsFile: string
  specFile?: string
}

const NavigationMenuRefList = ({
  id,
  basePath,
  commonSectionsFile,
  specFile,
}: NavigationMenuRefListProps) => {
  const commonSections = useCommonSections(commonSectionsFile)
  const spec = useSpec(specFile)

  if (!commonSections) {
    return null
  }

  if (specFile && !spec) {
    return null
  }

  const filteredSections = commonSections.filter((section) => {
    return !section.excludes?.includes(id)
  })

  return (
    <div className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150 h-auto">
      <NavigationMenuRefListItems
        id={id}
        commonSections={filteredSections}
        spec={spec}
        basePath={basePath}
      />
    </div>
  )
}

export default React.memo(NavigationMenuRefList)
