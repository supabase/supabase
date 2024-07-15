'use client'

import { usePathname } from 'next/navigation'
import { type PropsWithChildren } from 'react'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/guides'

const GuidesLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const menuId = getMenuId(pathname)

  return <Layout menuId={menuId}>{children}</Layout>
}

export const getMenuId = (pathname: string | null) => {
  pathname = (pathname ??= '').replace(/^\/guides\//, '')

  switch (true) {
    case pathname.startsWith('ai'):
      return MenuId.Ai
    case pathname.startsWith('api'):
      return MenuId.Api
    case pathname.startsWith('auth'):
      return MenuId.Auth
    case pathname.startsWith('cli'):
      return MenuId.Cli
    case pathname.startsWith('database'):
      return MenuId.Database
    case pathname.startsWith('functions'):
      return MenuId.Functions
    case pathname.startsWith('getting-started'):
      return MenuId.GettingStarted
    case pathname.startsWith('graphql'):
      return MenuId.Graphql
    case pathname.startsWith('platform'):
      return MenuId.Platform
    case pathname.startsWith('realtime'):
      return MenuId.Realtime
    case pathname.startsWith('resources'):
      return MenuId.Resources
    case pathname.startsWith('self-hosting'):
      return MenuId.SelfHosting
    case pathname.startsWith('storage'):
      return MenuId.Storage
    default:
      return MenuId.GettingStarted
  }
}

export default GuidesLayout
