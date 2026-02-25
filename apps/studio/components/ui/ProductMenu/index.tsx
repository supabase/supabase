import { Badge, Menu } from 'ui'

import type { ProductMenuGroup } from './ProductMenu.types'
import { ProductMenuItem } from './ProductMenuItem'

interface ProductMenuProps {
  page?: string
  menu: ProductMenuGroup[]
}

export const ProductMenu = ({ page, menu }: ProductMenuProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <Menu type="pills">
        {menu.map((group, idx) => (
          <div key={group.key || group.title}>
            <div className="my-4 space-y-4">
              <div className="md:mx-3">
                <Menu.Group
                  title={
                    group.title ? (
                      <div className="flex flex-col space-y-2 uppercase font-mono">
                        <span>{group.title}</span>
                        {group.isPreview && <Badge variant="warning">Not production ready</Badge>}
                      </div>
                    ) : null
                  }
                />
                <div>
                  {group.items.map((item) => {
                    const isActive = !!item.pages
                      ? item.pages.includes(page ?? '')
                      : page === item.key

                    return (
                      <ProductMenuItem
                        key={item.key}
                        item={item}
                        isActive={isActive}
                        target={item.isExternal ? '_blank' : '_self'}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            {idx !== menu.length - 1 && (
              <div className="h-px w-[calc(100%-1.5rem)] mx-auto md:w-full bg-border-overlay" />
            )}
          </div>
        ))}
      </Menu>
    </div>
  )
}
