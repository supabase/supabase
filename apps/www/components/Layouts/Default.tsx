import { useEffect } from 'react'
import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'
import PostTypes from '../../types/post'

type Props = {
  hideHeader?: boolean
  hideFooter?: boolean
  className?: string
  blogPosts?: PostTypes[]
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
      {!hideHeader && <Nav blogPosts={props.blogPosts} />}
      <div className="min-h-screen">
        <main className={className}>{children}</main>
      </div>
      {!hideFooter && <Footer className={footerClassName} />}
    </>
  )
}

export default DefaultLayout
