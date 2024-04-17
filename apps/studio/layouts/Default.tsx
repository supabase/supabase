import { PropsWithChildren } from 'react'
import { useThemeSync } from 'common'

const DefaultLayout = ({ children }: PropsWithChildren<{}>) => {
  useThemeSync('studio')

  return <>{children}</>
}

export default DefaultLayout
