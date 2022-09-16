import { useContext, useEffect, useState } from 'react'
import { AppContext } from 'lib/constants'
import { supabase } from 'lib/api'
import dynamic from 'next/dynamic'
import styles from 'styles/Map.module.css'
import SignIn from 'components/SignIn'
import PageLayout from 'components/PageLayout'

const MapInput = dynamic(() => import('components/MapInput'), { ssr: false })

function randomPosition() {
  var array = [
    {
      lat: 1.3489728457596013,
      lng: 103.77043978311998,
    },
    {
      lat: 1.37462,
      lng: 103.77694,
    },
    {
      lat: 1.41006,
      lng: 103.77144,
    },
    {
      lat: 1.34313,
      lng: 103.84191,
    },
    {
      lat: 1.35454,
      lng: 103.69746,
    },
  ]
  return array[Math.floor(Math.random() * array.length)]
}
const center = randomPosition()
const zoomLevel = 14

export default function Page() {
  const { session } = useContext(AppContext)
  const [userRole, setRole] = useState(null)
  const [username, setUsername] = useState(null)

  useEffect(() => {
    setRole(session?.user?.user_metadata?.role)
    setUsername(session?.user?.user_metadata?.username)
  }, [session])

  async function onSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.log('Error logging out:', error.message)
  }

  return (
    <PageLayout title="Driver View">
      <h1 className={styles.title}>Driver View</h1>

      <p className={styles.description}>
        Get started by drag-drop the marker around to simulate location update
      </p>

      <div className={styles.grid}>
        {!session && <SignIn />}
        {session && (
          <div className={styles.card}>
            {userRole?.toUpperCase() == 'DRIVER' && (
              <MapInput clientRef={session.user?.id} center={center} zoom={zoomLevel} />
            )}
            {userRole?.toUpperCase() == 'MANAGER' && (
              <p className={styles.error}>Sorry, You need to sign in as driver</p>
            )}
            <div className={styles.profile_container}>
              Signed in as {username} [{userRole}]<br />
              <button className={styles.sign_out} onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
