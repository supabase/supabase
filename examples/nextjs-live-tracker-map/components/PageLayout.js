import Head from 'next/head'

export default function PageLayout({ title, children }) {
  return (
    <div className="container">
      <Head>
        <title>{title}</title>
      </Head>
      <main className="main">{children}</main>

      <footer className="footer">
        <a href="https://supabase.io" target="_blank" rel="noopener noreferrer">
          Powered by <img src="/supabase.svg" alt="Supabase Logo" className="logo" />
        </a>
      </footer>
    </div>
  )
}
