import '~/styles/style.scss'
import Navbar from '../Navbar'
import NavbarDocs from '../NavbarDocs'
import Footer from '../Footer'
import Head from 'next/head'

export default function DocsLayout(props) {
  const { sidebar, activeCategory } = props
  return (
    <>
      <Head>
        <title>Supabase | Docs</title>
      </Head>
      <div className="">
        <Navbar isFullwidth={true} />
        <NavbarDocs activeCategory={activeCategory}/>
        <div className="columns m-none is-gapless">
          <div className="DocsMenuColumn column is-narrow is-hidden-mobile" style={{ width: 250 }}>
            {Sidebar(sidebar)}
          </div>
          <div className="column">{props.children}</div>
        </div>

        <Footer isFullwidth={true} />
      </div>
    </>
  )
}

const Sidebar = sidebar => {
  return Object.entries(sidebar || []).map(([heading, pages]) => {
    return (
      <div key={heading}>
        <p className="menu-label">{heading}</p>
        <ul className="menu-list">{pages.map(x => SidebarLink(x))}</ul>
      </div>
    )
  })
}

const SidebarLink = page => (
  <li key={page.slug}>
    <a className="">{page.title}</a>
  </li>
)
