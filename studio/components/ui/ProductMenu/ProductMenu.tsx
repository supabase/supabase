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
    <div className="flex flex-col space-y-8 overflow-y-auto">
      <Menu type="pills">
        {menu.map((group: ProductMenuGroup, idx: number) => (
          <>
            <div key={group.title} className="space-y-8 my-6">
              <div className="mx-3">
                <Menu.Group
                  //@ts-ignore
                  title={
                    <div className="flex flex-col space-y-2">
                      <span>{group.title}</span>
                      {group.isPreview && <Badge color="amber">Not production ready</Badge>}
                    </div>
                  }
                />
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
            </div>
            {idx !== menu.length - 1 && <div className="bg-scale-500 h-px w-full"></div>}
          </>
        ))}
      </Menu>
    </div>
  )
}

export default ProductMenu
