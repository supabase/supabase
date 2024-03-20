import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import { MenuId } from '~/components/Navigation/NavigationMenu/menus'
import Layout from '~/layouts/DefaultGuideLayout'
import refItems from '~/scripts/pregenerate/generated/commonClientLibFlat-Auth.json' assert { type: 'json' }

const meta = { title: 'Auth Functions: JavaScript Reference' }

const AuthJSReference = () => {
  return (
    <NavMenuProvider menuId={MenuId.Auth} refData={refItems}>
      <Layout meta={meta}>AAAAHHH</Layout>
    </NavMenuProvider>
  )
}

export default AuthJSReference
