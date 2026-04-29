import Nav from 'components/Nav/index'
import dynamic from 'next/dynamic'
import { cn } from 'ui'
import ThemeHandler from './ThemeHandler'

const Footer = dynamic(() => import('components/Footer/index'))

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
      <ThemeHandler />
      <Nav hideNavbar={hideHeader} stickyNavbar={stickyNavbar} />
      <main className={cn('relative min-h-screen', className)}>{children}</main>
      <Footer className={footerClassName} hideFooter={hideFooter} />
    </>
  )
}

export default DefaultLayout
