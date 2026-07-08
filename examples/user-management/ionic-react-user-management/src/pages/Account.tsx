import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonLoading,
  useIonToast,
  useIonRouter,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { supabase } from '../supabaseClient'

export function AccountPage() {
  const [showLoading, hideLoading] = useIonLoading()
  const [showToast] = useIonToast()
  const router = useIonRouter()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState({
    username: '',
    website: '',
    avatar_url: '',
  })

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    await showLoading()
    try {
      const { data: authData } = await supabase.auth.getClaims()
      if (!authData?.claims) throw new Error('No user logged in')
      const { claims } = authData

      setEmail(claims.email as string)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', claims.sub)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setProfile({
          username: data.username,
          website: data.website,
          avatar_url: data.avatar_url,
        })
      }
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 })
    } finally {
      await hideLoading()
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/', 'forward', 'replace')
  }

  const updateProfile = async (e?: any, avatar_url?: string) => {
    e?.preventDefault()

    await showLoading()

    try {
      const { data } = await supabase.auth.getClaims()
      if (!data?.claims) throw new Error('No user logged in')
      const { claims } = data

      const updates = {
        id: claims.sub,
        ...profile,
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }

      // Ensure local profile state reflects the updated avatar URL
      if (avatar_url !== undefined) {
        setProfile((prev) => ({
          ...prev,
          avatar_url,
        }))
      }

      if (avatar_url !== undefined) {
        setProfile((current) => ({
          ...current,
          avatar_url,
        }))
      }
    } catch (error: any) {
      showToast({ message: error.message, duration: 5000 })
    } finally {
      await hideLoading()
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <Avatar
          url={profile.avatar_url}
          onUpload={(fileName) => updateProfile(undefined, fileName)}
        ></Avatar>
        <form onSubmit={updateProfile}>
          <IonItem>
            <IonLabel>
              <p>Email</p>
              <p>{email}</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonInput
              type="text"
              name="username"
              value={profile.username}
              onIonInput={(e) => setProfile({ ...profile, username: e.detail.value ?? '' })}
              label="Name"
              labelPlacement="stacked"
            ></IonInput>
          </IonItem>

          <IonItem>
            <IonInput
              type="url"
              name="website"
              value={profile.website}
              onIonInput={(e) => setProfile({ ...profile, website: e.detail.value ?? '' })}
              label="Website"
              labelPlacement="stacked"
            ></IonInput>
          </IonItem>
          <div className="ion-text-center">
            <IonButton fill="clear" type="submit">
              Update Profile
            </IonButton>
          </div>
        </form>

        <div className="ion-text-center">
          <IonButton fill="clear" onClick={signOut}>
            Log Out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
