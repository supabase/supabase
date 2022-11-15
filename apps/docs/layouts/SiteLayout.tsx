import Footer from '~/components/Footer'
import NavBar from '~/components/Navigation/NavBar'
import NavigationMenu from '~/components/NavigationMenu'

const Layout = ({ children }) => {
  return (
    <>
      <main>
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
