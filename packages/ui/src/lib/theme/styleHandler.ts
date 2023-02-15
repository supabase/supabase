import { useContext } from 'react'
import defaultTheme from './../theme/defaultTheme'
import { ThemeContext } from './../../components/ThemeProvider/ThemeProvider'

export default function styleHandler(target: string) {
  let {
    theme: { [target]: __styles },
  }: any = useContext(ThemeContext)

  if (!__styles) __styles = defaultTheme.button
  __styles = JSON.stringify(__styles).replace(/\\n/g, '').replace(/\s\s+/g, ' ')
  return JSON.parse(__styles)
}
