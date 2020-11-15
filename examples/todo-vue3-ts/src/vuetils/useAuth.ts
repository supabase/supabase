import { ref } from 'vue'
import { supabase } from '@/lib/supabase.ts'
import { Session } from '@supabase/gotrue-js/dist/main/lib/types'

const userSession = ref<Session | null>(null)

async function handleLogin(credentials: Credentials) {
  try {
    const { error, user } = await supabase.auth.signIn({
      email: credentials.email,
      password: credentials.password,
    })
    console.log("what is user?", user, error)
    if (error) {
      alert("Error logging in")
      console.error('Error returned:', error.message)
    }
    // No error throw, but no user detected so send magic link
    if (!error && !user) {
      alert('Check your email for the login link!')
    }
  } catch (error) {
    console.error('Error thrown:', error.message)
    alert(error.error_description || error)
  }
}

async function forgotPassword() {
  const email = prompt('Please enter your email:')
  if (email === null || email === '') {
    window.alert('You must enter your email.')
  } else {
    const { error } = await supabase.auth.api.resetPasswordForEmail(email)
    if (error) {
      console.log('Error: ', error.message)
    } else {
      alert('Password recovery email has been sent.')
    }
  }
}

async function logout() {
  console.log('logging out')
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      alert('error signing out')
      console.error('Error!', error)
      return
    }

    alert('You have signed out!')
  } catch (err) {
    alert('Fatal error signing out')
    console.error('Error!', err)
  }
}

export { userSession, handleLogin, logout, forgotPassword }
