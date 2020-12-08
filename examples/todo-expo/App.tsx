import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Platform } from 'react-native'
import { ThemeProvider, colors, Text } from 'react-native-elements'
import { Styles } from './lib/constants'
import Auth from './components/Auth'

const theme = {
  colors: {
    ...Platform.select({
      default: colors.platform.android,
      ios: colors.platform.ios,
    }),
  },
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <View style={styles.container}>
        <View style={styles.verticallySpaced}>
          <Text h1>Todo List</Text>
        </View>
        <Auth />
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
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
