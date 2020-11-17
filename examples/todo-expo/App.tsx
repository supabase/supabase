import React from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import { createClient } from '@supabase/supabase-js'
import { StatusBar } from 'expo-status-bar'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Styles, SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/constants'

import Button from './components/Button'
import TextField from './components/TextField'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  localStorage: AsyncStorage as any,
})

export default function App() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleLogin = async (type: string, email: string, password: string) => {

    console.log(supabase)
    try {
      const { error, user } =
        type === 'LOGIN'
          ? await supabase.auth.signIn({ email, password })
          : await supabase.auth.signUp({ email, password })
      if (!error && !user) Alert.alert('Check your email for the login link!')
      if (error) Alert.alert(error.message)
      console.log('user', user)
      console.log('error', error)
    } catch (error) {
      console.log('Error thrown:', error.message)
      Alert.alert(error.error_description || error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Text style={{ fontSize: Styles.fontExtraLarge, fontWeight: 'bold' }}>To Do List</Text>
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Text>Email</Text>
        <TextField
          onChangeText={(text) => setEmail(text)}
          text={email}
          placeholder="Enter your email"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text>Password</Text>
        <TextField
          onChangeText={(text) => setPassword(text)}
          text={password}
          type={'password'}
          placeholder="Enter your password"
          customStyles={{ textTransform: 'lowercase' }}
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Button text="Log in" onPress={() => handleLogin('LOGIN', email, password)} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button text="Sign up" onPress={() => alert('hey')} />
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: Styles.spacing,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
})
