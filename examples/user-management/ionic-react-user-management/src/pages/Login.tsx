import { useState } from 'react'
import type React from 'react'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonLoading,
} from '@ionic/react'
import { supabase } from '../supabaseClient'

export function LoginPage() {
  const [email, setEmail] = useState('')

  const [showLoading, hideLoading] = useIonLoading()
  const [showToast] = useIonToast()
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await showLoading()
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      await showToast({ message: 'Check your email for the login link!' })
    } catch (e: any) {
      await showToast({ message: e.error_description || e.message, duration: 5000 })
    } finally {
      await hideLoading()
    }
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="ion-padding">
          <h1>Supabase + Ionic React</h1>
          <p>Sign in via magic link with your email below</p>
        </div>
        <IonList inset={true}>
          <form onSubmit={handleLogin}>
            <IonItem>
              <IonInput
                value={email}
                name="email"
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
                type="email"
                label="Email"
                labelPlacement="stacked"
              ></IonInput>
            </IonItem>
            <div className="ion-text-center">
              <IonButton type="submit" fill="clear">
                Login
              </IonButton>
            </div>
          </form>
        </IonList>
      </IonContent>
    </IonPage>
  )
}
