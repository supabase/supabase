import '../styles/index.css'

// Reference: https://dev.to/apkoponen/how-to-disable-server-side-rendering-ssr-in-next-js-1563
// Without this, you'll get an error like: Expected server HTML to contain a matching <h1> in <div>.
// This is because when rendering on the server side, Supabase is not able to retrieve
// the current user. To properly fix this, you'd need to get and set auth cookies
// like this: https://github.com/supabase/gotrue-js/blob/f09d4cbf3a7446325e9578736fd9d9b3bff3796e/example/next/utils/useAuth.js
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
