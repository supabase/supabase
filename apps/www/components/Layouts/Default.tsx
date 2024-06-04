import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import { cn } from 'ui'
import { useForceDeepDark } from '~/lib/theme.utils'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  className?: string
  footerClassName?: string
  children: React.ReactNode
}

const DefaultLayout = (props: Props) => {
  const {
    hideHeader = false,
    hideFooter = false,
    className = '',
    footerClassName = '',
    children,
  } = props

  useForceDeepDark()

  return (
    <>
      <Nav hideNavbar={hideHeader} />
      <main className={cn('relative min-h-screen', className)}>{children}</main>
      <Footer className={footerClassName} hideFooter={hideFooter} />
    </>
  )
}

export default DefaultLayout
