import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Styles, SUPABASE_URL, SUPABASE_KEY } from './lib/constants'

import Button from './components/Button'
import TextField from './components/TextField'

export default function App() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  console.log(SUPABASE_KEY)
  

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Text style={{ fontSize: Styles.fontExtraLarge, fontWeight: 'bold' }}>To Do List</Text>
        <Text style={{ fontSize: Styles.fontExtraLarge, fontWeight: 'bold' }}>{SUPABASE_KEY}</Text>
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Text>Email</Text>
        <TextField
          onChangeText={(text) => setEmail(text)}
          text={email}
          placeholder="Enter your email"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text>Password</Text>
        <TextField
          onChangeText={(text) => setPassword(text)}
          text={password}
          type={'password'}
          placeholder="Enter your password"
        />
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Button text="Log in" onPress={() => alert('hey')} />
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
