import { useContext, useMemo } from 'react'
import defaultTheme, { DefaultTheme, StylesOf } from './defaultTheme'
import { ThemeContext } from '../../components/ThemeProvider/ThemeProvider'

export default function useStyles<T extends keyof DefaultTheme>(target: T): StylesOf<T> {
  const { theme } = useContext(ThemeContext)

  const styles = useMemo(() => {
    const rawStyles = theme?.[target]
    if (rawStyles === undefined) {
      return removeNewLinesFromStyles(defaultTheme.button)
    }

    return removeNewLinesFromStyles(rawStyles)
  }, [target, theme])

  return styles as unknown as StylesOf<T>
}

const removeNewLinesFromStyles = (rawStyles: Record<string, unknown>): Record<string, unknown> =>
  JSON.parse(JSON.stringify(rawStyles).replace(/\\n/g, '').replace(/\s\s+/g, ' '))
