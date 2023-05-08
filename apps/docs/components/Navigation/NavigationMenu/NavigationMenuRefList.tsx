import { Json } from '~/types'
import NavigationMenuRefListItems from './NavigationMenuRefListItems'

import React, { useEffect, useState } from 'react'
import { ICommonBase, ICommonItem } from '~/components/reference/Reference.types'

interface NavigationMenuRefListProps {
  id: string
  basePath: string
  commonSectionsImport: () => Promise<ICommonBase[]>
  specImport?: () => Promise<Json>
}

const NavigationMenuRefList = ({
  id,
  basePath,
  commonSectionsImport,
  specImport,
}: NavigationMenuRefListProps) => {
  const [commonSections, setCommonSections] = useState<ICommonItem[]>()
  const [spec, setSpec] = useState<Json>()

  // Dynamic imports allow for code splitting which
  // dramatically reduces app bundle size
  useEffect(() => {
    async function fetchCommonSections() {
      const commonSections = await commonSectionsImport()
      setCommonSections(commonSections as ICommonItem[])
    }
    fetchCommonSections()
  }, [commonSectionsImport])

  useEffect(() => {
    if (!specImport) {
      return
    }
    async function fetchSpec() {
      const spec = await specImport()
      setSpec(spec)
    }
    fetchSpec()
  }, [specImport])

  if (!commonSections) {
    return null
  }

  if (specImport && !spec) {
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
