import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import { cn } from 'ui'
import PostTypes from '~/types/post'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  className?: string
  latestPosts?: PostTypes[]
  footerClassName?: string
  children: React.ReactNode
}

const DefaultLayout = (props: Props) => {
  const {
    hideHeader = false,
    hideFooter = false,
    className = '',
    latestPosts,
    footerClassName = '',
    children,
  } = props

  return (
    <>
      <Nav hideNavbar={hideHeader} latestPosts={latestPosts} />
      <main className={cn('relative min-h-screen', className)}>{children}</main>
      <Footer className={footerClassName} hideFooter={hideFooter} />
    </>
  )
}

export default DefaultLayout
