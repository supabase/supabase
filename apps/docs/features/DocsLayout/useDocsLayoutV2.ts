'use client'

import { useIaNavVariant } from '~/features/IaNav/useIaNavVariant'
import { useEffect } from 'react'

// the option-1 variant of the docs-ia-mvp-v1 flag turns on the new layout
export const useDocsLayoutV2 = (): boolean => {
  const isLayoutV2 = useIaNavVariant() === 'option-1'

  // exception: the head script marks the page from the cached variant, so the loaded flag can change it
  useEffect(() => {
    if (isLayoutV2) document.documentElement.dataset.iaNav = 'option-1'
    else delete document.documentElement.dataset.iaNav
  }, [isLayoutV2])

  return isLayoutV2
}
