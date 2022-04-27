import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Platform } from 'react-native'
import { ThemeProvider, colors, Text } from 'react-native-elements'
import { Styles } from './lib/constants'
import { UserContextProvider, useUser } from './components/UserContext'
import List from './components/TodoList'
import Auth from './components/Auth'

const theme = {
  colors: {
    ...Platform.select({
      default: colors.platform.android,
      ios: colors.platform.ios,
    }),
  },
}

const Container = () => {
  const { user } = useUser()

  return user ? <List /> : <Auth />
}

export default function App() {
  return (
    <UserContextProvider>
      <ThemeProvider theme={theme}>
        <View style={styles.container}>
          <View style={styles.verticallySpaced}>
            <Text h1>Todo List</Text>
          </View>
          <Container />
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </UserContextProvider>
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
