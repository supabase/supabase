import { PropsWithChildren } from 'react'
import useThemeSync from 'common/hooks/useThemeSync'

const DefaultLayout = ({ children }: PropsWithChildren<{}>) => {
  useThemeSync('studio')

  return <>{children}</>
}

export default DefaultLayout
