import '~/styles/style.scss'
import Navbar from '../Navbar'
import NavbarDocs from '../NavbarDocs'
import Footer from '../Footer'
import Head from 'next/head'

export default function DocsLayout(props) {
  return (
    <>
      <Head>
        <title>Supabase | Docs</title>
      </Head>
      <div className="">
        <Navbar isFullwidth={true} />
        <NavbarDocs />
        <div className="columns m-none is-gapless">
          <div className="DocsMenuColumn column is-narrow is-hidden-mobile" style={{ width: 250 }}>
            <p className="menu-label">Documentation</p>
            <ul className="menu-list">
              <li><a className="">Manage Your Team</a></li>
              <li><a className="is-active">Manage Your Team</a></li>
              <li><a className="">Manage Your Team</a></li>
            </ul>
          </div>
          <div className="column">{props.children}</div>
        </div>

        <Footer isFullwidth={true} />
      </div>
    </>
  )
}
