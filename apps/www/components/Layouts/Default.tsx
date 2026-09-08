import { cn } from 'ui'
import { SkipToContent } from 'ui-patterns/SkipToContent'

import Footer from '@/components/Footer/index'
import Nav from '@/components/Nav/index'
import { ThemeForcer } from '@/components/ThemeForcer'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  stickyNavbar?: boolean
  className?: string
  footerClassName?: string
  children: React.ReactNode
}

const DefaultLayout = (props: Props) => {
  const {
    hideHeader = false,
    hideFooter = false,
    stickyNavbar = true,
    className = '',
    footerClassName = '',
    children,
  } = props

  return (
    <>
      <SkipToContent href="#main" />
      <ThemeForcer />
      <Nav hideNavbar={hideHeader} stickyNavbar={stickyNavbar} />
      <main
        id="main"
        tabIndex={-1}
        className={cn('relative min-h-screen scroll-mt-16 outline-hidden', className)}
      >
        {children}
      </main>
      <Footer className={footerClassName} hideFooter={hideFooter} />
    </>
  )
}

export default DefaultLayout
