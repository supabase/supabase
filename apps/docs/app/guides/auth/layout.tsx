import { type PropsWithChildren } from 'react'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/guides'

const GuidesLayout = ({ children }: PropsWithChildren) => (
  <Layout menuId={MenuId.Auth}>
    <div className="prose max-w-none">{children}</div>
  </Layout>
)

export default GuidesLayout
