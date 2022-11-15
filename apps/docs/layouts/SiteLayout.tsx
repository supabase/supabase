import Link from 'next/link'
import { useRouter } from 'next/router'
import Footer from '~/components/Footer'
import NavigationMenu from '~/components/Navigation/NavigationMenu/NavigationMenu'
import TopNavBar from '~/components/Navigation/NavigationMenu/TopNavBar'

const Layout = ({ children }) => {
  const router = useRouter()
  return (
    <>
      <main>
        <img
          src={`${router.basePath}/img/gradient-bg.png`}
          className="absolute left-0 w-[520px] top-0 -z-10"
        />
        <div className="mx-auto sticky top-0 z-10">
          <TopNavBar />
        </div>
        <div className="grid grid-cols-12 opacity-100 duration-100 max-w-[1400px] mx-auto py-16 gap-4 px-5">
          <div className="col-span-3">
            <NavigationMenu />
          </div>
          <div className="col-span-9">
            <Link href="/docs/new/database" passHref>
              go to database
            </Link>
            {children}
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}

export default Layout
