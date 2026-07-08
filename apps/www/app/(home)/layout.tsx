import Footer from '~/components/Footer'
import Nav from '~/components/Nav'

import { ThemeForcer } from './ThemeForcer'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeForcer />
      <Nav hideNavbar={false} />
      <div className="relative w-full">
        <main className="relative min-h-screen">{children}</main>
      </div>
      <Footer />
    </>
  )
}
