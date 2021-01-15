import '../styles/index.css'

// Reference: https://dev.to/apkoponen/how-to-disable-server-side-rendering-ssr-in-next-js-1563
// Without this, you'll get an error like: Expected server HTML to contain a matching <h1> in <div>.
// It's probably because server side rendering doesn't seem to work well
// with Supabase. I'll look into this issue next.
function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps }) {
  return <SafeHydrate><Component {...pageProps}/></SafeHydrate>
}

export default MyApp
