import React from 'react'
import { TextInput, StyleSheet } from 'react-native'
import { Styles } from '../lib/constants'

type TextFieldProps = {
  onChangeText: ((text: string) => void) | undefined
  text: string
  type?: 'none' | 'password'
  placeholder?: string
  customStyles?: object
  autoCapitalize?: 'sentences' | 'characters' | 'words' | 'none'
}

export default function TextField({
  onChangeText,
  text,
  type = 'none',
  placeholder = '',
  customStyles = {},
  autoCapitalize = 'none'
}: TextFieldProps) {
  return (
    <TextInput
      style={[styles.textInput, customStyles]}
      onChangeText={onChangeText}
      value={text}
      placeholder={placeholder}
      textContentType={type}
      secureTextEntry={type == 'password'}
      autoCapitalize={autoCapitalize}
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
