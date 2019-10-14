import '~/styles/style.scss'
import Navbar from '../Navbar'
import NavbarDocs from '../NavbarDocs'
import Footer from '../Footer'
import Head from 'next/head'

export default function DocsLayout(props) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Supabase | Docs</title>
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </Head>
      <div className="">
        <Navbar isFullwidth={true} />
        <NavbarDocs />
        <div className="columns m-none is-gapless">
          <div className="DocsMenuColumn column is-narrow is-hidden-mobile" style={{ width: 250 }}>
            <p class="menu-label">Documentation</p>
            <ul class="menu-list">
              <li><a class="">Manage Your Team</a></li>
              <li><a class="is-active">Manage Your Team</a></li>
              <li><a class="">Manage Your Team</a></li>
            </ul>
          </div>
          <div className="column">{props.children}</div>
        </div>

        <Footer isFullwidth={true} />
      </div>
    </>
  )
}
