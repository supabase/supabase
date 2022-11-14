import Footer from '~/components/Footer'
import NavBar from '~/components/Navigation/NavBar'
import NavigationMenu from '~/components/NavigationMenu'

const Layout = ({ children }) => {
  return (
    <>
      <main>
        <NavBar />
        <div className="flex flex-row opacity-100 duration-100">
          <div className="w-[320px]">
            <NavigationMenu />
          </div>
          <div className="">{children}</div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
