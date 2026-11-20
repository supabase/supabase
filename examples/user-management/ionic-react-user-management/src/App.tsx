import { Redirect, Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { supabase } from './supabaseClient'

import '@ionic/react/css/ionic.bundle.css'

/* Theme variables */
import './theme/variables.css'
import { LoginPage } from './pages/Login'
import { AccountPage } from './pages/Account'
import { useEffect, useState } from 'react'
import type { FC } from 'react'

setupIonicReact()

const App: FC = () => {
  const [claims, setClaims] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      if (data) {
        setClaims(data.claims)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getClaims().then(({ data }) => {
        if (data) {
          setClaims(data.claims)
        }
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route
            exact
            path="/"
            render={() => {
              return claims ? <Redirect to="/account" /> : <LoginPage />
            }}
          />
          <Route
            exact
            path="/account"
            render={() => (claims ? <AccountPage /> : <Redirect to="/" />)}
          />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default App
