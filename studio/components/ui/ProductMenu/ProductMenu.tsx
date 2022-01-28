import { FC } from 'react'
import Link from 'next/link'
import { Badge, Divider, Menu, Typography } from '@supabase/ui'
import { ProductMenuItem, ProductMenuGroup } from './ProductMenu.types'

interface Props {
  page?: string
  menu: ProductMenuGroup[]
}

const ProductMenu: FC<Props> = ({ page, menu }) => {
  return (
    <div className="my-6 flex flex-col flex-grow space-y-4 overflow-y-auto">
      <Menu>
        {menu.map((group: ProductMenuGroup, idx: number) => (
          <div key={group.title} className="space-y-4">
            <div className="mx-4 space-y-2">
              <div className="w-full flex">
                <h5 className="text-sm text-scale-1200">{group.title}</h5>
              </div>
              {group.isPreview && (
                <div className="mx-2">
                  <Badge color="yellow">Not production ready</Badge>
                </div>
              )}
              <div className="dash-product-menu">
                {group.items.map((item: ProductMenuItem) => (
                  <Link key={item.key} href={item.url}>
                    <a className="block" target={item.isExternal ? '_blank' : '_self'}>
                      <Menu.Item icon={item.icon} rounded active={page === item.key}>
                        <Typography.Text className="truncate">{item.name}</Typography.Text>
                      </Menu.Item>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
            {idx !== menu.length - 1 && <Divider light />}
          </div>
        ))}
      </Menu>
    </div>
  )
}

export default ProductMenu
