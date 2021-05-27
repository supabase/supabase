import { useContext, useEffect, useState } from 'react'
import { AppContext } from 'lib/constants'
import { supabase } from 'lib/api'
import styles from 'styles/Map.module.css'
import dynamic from 'next/dynamic'
import SignIn from 'components/SignIn'
import PageLayout from 'components/PageLayout'

const MapView = dynamic(() => import('components/MapView'), { ssr: false })
const center = {
  lat: 1.3489728457596013,
  lng: 103.77043978311998,
}
const zoomLevel = 12

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
    <PageLayout title="Manager View">
      <h1 className={styles.title}>Manager View</h1>

      <p className={styles.description}>
        As manager, you can view all drivers' locations as long as the drivers are ONLINE
      </p>

      <div className={styles.grid}>
        {!session && <SignIn role="MANAGER" />}
        {session && (
          <div className={styles.card}>
            {userRole?.toUpperCase() == 'MANAGER' && <MapView center={center} zoom={zoomLevel} />}
            {userRole?.toUpperCase() == 'DRIVER' && (
              <p className={styles.error}>Sorry, you need to sign in as manager</p>
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
