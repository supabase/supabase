import { useContext } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import styles from 'styles/Map.module.css'
import { supabase } from 'lib/Store'
import SignIn from 'components/SignIn'
import UserContext from 'lib/UserContext'

const MapInput = dynamic(
  () => import('components/MapInput'),
  { ssr: false }
)

function randomPosition() {
  var array = [
    {
      lat: 1.3489728457596013,
      lng: 103.77043978311998
    },
    {
      lat: 1.37462,
      lng: 103.77694
    },
    {
      lat: 1.41006,
      lng: 103.77144
    },
    {
      lat: 1.34313,
      lng: 103.84191
    },
    {
      lat: 1.35454,
      lng: 103.69746
    }
  ];
  return array[Math.floor(Math.random() * array.length)];
}

export default function Page() {
  const { user, signOut } = useContext(UserContext)
  const center = randomPosition()
  const zoomLevel = 14

  return (
    <div className={styles.container}>
      <Head>
        <title>Driver View</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
          integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
          crossOrigin=""
        />
        <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
          integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
          crossOrigin=""></script>
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Driver View
        </h1>

        <p className={styles.description}>
          Get started by drag-drop the marker around to simulate location update
        </p>

        <div className={styles.grid}>
          {!user && <SignIn />}
          {user && (
            <div className={styles.card}>
              {
                user.role === "DRIVER"
                  ? <MapInput supabase={supabase} clientRef={user?.id} center={center} zoom={zoomLevel} />
                  : <p className={styles.error}>Sorry, You need to sign in as driver</p>
              }
              <div className={styles.profile_container}>
                Signed in as {user.username} [{user.role}]<br />
                <button className={styles.sign_out} onClick={signOut}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <a
          href="https://supabase.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/supabase.svg" alt="Supabase Logo" className="logo" />
        </a>
      </footer>
    </div >
  )
}
