import React from 'react'
import { TextInput, StyleSheet } from 'react-native'
import { Styles } from '../lib/constants'

type TextFieldProps = {
  onChangeText: ((text: string) => void) | undefined
  text: string
  type?: 'none' | 'password'
  placeholder?: string
}

export default function TextField({ onChangeText, text, type = 'none', placeholder = '' }: TextFieldProps) {
  return (
    <TextInput
      style={styles.textInput}
      onChangeText={onChangeText}
      value={text}
      placeholder={placeholder}
      textContentType={type}
      secureTextEntry={type == 'password'}
    />
  )
}

const styles = StyleSheet.create({
  textInput: {
    fontSize: Styles.fontNormal,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 50,
    padding: Styles.spacing,
  },
})
