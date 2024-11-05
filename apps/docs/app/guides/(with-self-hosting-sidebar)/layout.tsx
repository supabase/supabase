import { type PropsWithChildren } from 'react'

import { NavigationMenuSelfHosting } from '~/components/Navigation/NavigationMenu/NavigationMenuSelfHosting'
import Layout from '~/layouts/guides'

const GuidesLayout = async ({ children }: PropsWithChildren) => {
  return <Layout NavigationMenu={<NavigationMenuSelfHosting />}>{children}</Layout>
}

export default GuidesLayout
