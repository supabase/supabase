import { useRouter } from 'next/router'
import Footer from '~/components/Footer'
import NavBar from '~/components/Navigation/NavBar'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'

const Layout = ({ children }) => {
  const router = useRouter()
  return (
    <>
      <main>
        <img
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0"
        />
        <div className="max-w-[1400px] mx-auto">
          <NavBar />
        </div>
        <div className="grid grid-cols-12 opacity-100 duration-100 max-w-[1400px] mx-auto py-16 gap-4 px-5">
          <div className="col-span-3">
            <NavigationMenu />
          </div>
          <div className="col-span-9">{children}</div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
