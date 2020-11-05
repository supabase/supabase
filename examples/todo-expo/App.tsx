import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Styles } from './constants'

import Button from './components/Button'
import TextField from './components/TextField'

export default function App() {
  const [email, onChangeEmail] = React.useState('')
  const [password, onChangePassword] = React.useState('')

  return (
    <View style={styles.container}>
      <View style={styles.verticallySpaced}>
        <Text style={{ fontSize: Styles.fontExtraLarge, fontWeight: 'bold' }}>To Do List</Text>
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Text>Email</Text>
        <TextField
          onChangeText={(text) => onChangeEmail(text)}
          text={email}
          placeholder="Enter your email"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text>Password</Text>
        <TextField
          onChangeText={(text) => onChangePassword(text)}
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
