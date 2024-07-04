import React from 'react'

import type { ICommonItem } from '~/components/reference/Reference.types'
import type { Json } from '~/types'
import NavigationMenuRefListItems from './NavigationMenuRefListItems'

interface NavigationMenuRefListProps {
  id: string
  basePath: string
  commonSections: ICommonItem[]
  spec: Json
}

const NavigationMenuRefList = ({
  id,
  basePath,
  commonSections,
  spec,
}: NavigationMenuRefListProps) => {
  const filteredSections = commonSections.filter((section) => {
    if (section.type === 'category') {
      section.items = section.items.filter((item) => {
        return !item.excludes?.includes(id)
      })
    }

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
