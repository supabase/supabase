import Nav from 'components/Nav/index'
import Footer from 'components/Footer/index'

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
      <div className="min-h-screen">
        <main className={className}>{children}</main>
      </div>
      {!hideFooter && <Footer className={footerClassName} />}
    </>
  )
}

export default DefaultLayout
