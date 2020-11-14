import { createApp } from 'vue'
import App from './App.vue'
import { supabase } from './lib/supabase'
import { userSession } from '@/vuetils/useAuth'
import './assets/tailwind.css'

createApp(App)
  .mount('#app')

supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth Event", event)
  console.log("supabase session", session)
  userSession.value = session;
})