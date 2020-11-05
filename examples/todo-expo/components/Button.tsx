import React from 'react'
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Styles } from '../lib/constants'

type ButtonProps = {
  text: string
  onPress: ((event: GestureResponderEvent) => void) | undefined
}

export default function Button({ text, onPress }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Styles.colorPrimary,
    alignSelf: 'stretch',
    padding: Styles.spacing,
    borderRadius: 4,
  },
  buttonText: { fontSize: Styles.fontNormal, color: '#fff', textAlign: 'center' },
})
