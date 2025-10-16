import { Badge, Menu } from 'ui'

import type { ProductMenuGroup } from './ProductMenu.types'
import ProductMenuItem from './ProductMenuItem'

interface ProductMenuProps {
  page?: string
  menu: ProductMenuGroup[]
}

const ProductMenu = ({ page, menu }: ProductMenuProps) => {
  return (
    <div className="flex flex-col space-y-8">
      <Menu type="pills">
        {menu.map((group, idx) => (
          <div key={group.key || group.title}>
            <div className="my-6 space-y-8">
              <div className="mx-3">
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
                        url={item.url}
                        name={item.name}
                        icon={item.icon}
                        rightIcon={item.rightIcon}
                        isActive={isActive}
                        isExternal={item.isExternal}
                        target={item.isExternal ? '_blank' : '_self'}
                        label={item.label}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            {idx !== menu.length - 1 && <div className="h-px w-full bg-border-overlay" />}
          </div>
        ))}
      </Menu>
    </div>
  )
}

export default ProductMenu
