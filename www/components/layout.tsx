import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import Meta from 'components/meta'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ preview, children }: Props) => {
  return (
    <>
      <Meta />
      <Nav />
      <div className="min-h-screen bg-gray-100">
        <main>{children}</main>
      </div>
      <Footer />
    </>
  )
}

export default Layout
