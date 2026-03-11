import { useMemo } from 'react'

import { ProductMenu } from './index'
import type { SubMenuProps } from './ProductMenu.types'
import { convertSectionsToProductMenu } from './SubMenu.utils'

export function SubMenu({ sections, page, onItemClick }: SubMenuProps) {
  const menu = useMemo(() => convertSectionsToProductMenu(sections), [sections])
  return <ProductMenu page={page} menu={menu} onItemClick={onItemClick} />
}
