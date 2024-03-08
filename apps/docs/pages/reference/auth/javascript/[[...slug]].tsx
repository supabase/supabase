import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import Layout from '~/layouts/DefaultGuideLayout'
import refItems from '~/scripts/pregenerate/generated/commonClientLibFlat-Auth.json' assert { type: 'json' }

const meta = { title: 'Auth Functions: JavaScript Reference' }

const AuthJSReference = () => {
  return (
    <NavMenuProvider refData={refItems}>
      <Layout meta={meta}>AAAAHHH</Layout>
    </NavMenuProvider>
  )
}

export default AuthJSReference
