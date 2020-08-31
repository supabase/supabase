import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const MapInput = dynamic(
  () => import('components/MapInput'),
  { ssr: false }
)

const MapView = dynamic(
  () => import('components/MapView'),
  { ssr: false }
)

export default function Home() {
  const [clientRef, setClientRef] = useState(null)
  const apiEndpoint = process.env.NEXT_PUBLIC_SUPABASE_ENDPOINT || "https://BeQiprVORewGZImzsKAS.supabase.co"
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_APIKEY || "IHDL7hnmTSlqQ1fm7kYw5SBQPY11Rp"
  // Create a single supabase client for interacting with your database 
  const supabase = createClient(apiEndpoint, apiKey);
  const center = {
    lat: 1.3489728457596013,
    lng: 103.77043978311998
  }
  const zoomLevel = 14

  useEffect(() => {
    let ref = localStorage.getItem('_client-ref')
    if (!ref) {
      ref = nanoid()
      localStorage.setItem('_client-ref', ref)
    }
    setClientRef(ref)
  }, [])

  return (
    <div className="container">
      <Head>
        <title>Live Tracker</title>
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
      <main>
        <h1 className="title">
          Live Tracker
        </h1>

        <p className="description">
          Get started by drag-drop the marker around to simulate location update
        </p>

        <div className="grid">
          <div className="card">
            <MapInput supabase={supabase} clientRef={clientRef} center={center} zoom={zoomLevel} />
          </div>
          <div className="card">
            <MapView supabase={supabase} clientRef={clientRef} center={center} zoom={zoomLevel - 1} />
          </div>
        </div>
      </main>

      <footer>
        <a
          href="https://supabase.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/supabase.svg" alt="Supabase Logo" className="logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 100%;
          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-grow: 1;
          text-align: left;
          color: inherit;
          text-decoration: none;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
          .card {
            width: 100%;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .leaflet-container {
          min-height: 20rem;
        }
      `}</style>
    </div>
  )
}
