'use client'

import { usePathname } from 'next/navigation'
import { type PropsWithChildren } from 'react'

import { getMenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu.utils'
import Layout from '~/layouts/guides'

const GuidesLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const menuId = getMenuId(pathname)

  return <Layout menuId={menuId}>{children}</Layout>
}

export default GuidesLayout
