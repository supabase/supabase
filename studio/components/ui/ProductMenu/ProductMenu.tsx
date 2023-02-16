import { FC } from 'react'
import { Badge, Menu } from 'ui'
import ProductMenuItem from './ProductMenuItem'
import { ProductMenuGroup, ProductMenuGroupItem } from './ProductMenu.types'

interface Props {
  page?: string
  menu: ProductMenuGroup[]
}

const ProductMenu: FC<Props> = ({ page, menu }) => {
  return (
    <div className="flex flex-col space-y-8 overflow-y-auto">
      <Menu type="pills">
        {menu.map((group: ProductMenuGroup, idx: number) => (
          <div key={group.title}>
            <div className="my-6 space-y-8">
              <div className="mx-3">
                <Menu.Group
                  //@ts-ignore
                  title={
                    group.title ? (
                      <div className="flex flex-col space-y-2">
                        <span>{group.title}</span>
                        {group.isPreview && <Badge color="amber">Not production ready</Badge>}
                      </div>
                    ) : null
                  }
                />
                <div>
                  {group.items.map((item: ProductMenuGroupItem) => (
                    <ProductMenuItem
                      key={item.key}
                      url={item.url}
                      name={item.name}
                      icon={item.icon}
                      isActive={page === item.key}
                      isExternal={item.isExternal}
                      target={item.isExternal ? '_blank' : '_self'}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            {idx !== menu.length - 1 && <div className="h-px w-full bg-scale-500"></div>}
          </div>
        ))}
      </Menu>
    </div>
  )
}

export default ProductMenu
