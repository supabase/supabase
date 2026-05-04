import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Account from './Account'

function App() {
  const [claims, setClaims] = useState(null)

  useEffect(() => {
    const {
      data: { claims },
    } = supabase.auth.getClaims()
    setClaims(claims)

    supabase.auth.onAuthStateChange(() => {
      const {
        data: { claims },
      } = supabase.auth.getClaims()
      setClaims(claims)
    })
  }, [])

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!claims ? <Auth /> : <Account key={claims.sub} claims={claims} />}
    </div>
  )
}

export default App
