import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import { cn } from 'ui'

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

  return (
    <>
      {!hideHeader && <Nav />}
      <main className={cn('min-h-screen', className)}>{children}</main>
      {!hideFooter && <Footer className={footerClassName} />}
    </>
  )
}

export default DefaultLayout
