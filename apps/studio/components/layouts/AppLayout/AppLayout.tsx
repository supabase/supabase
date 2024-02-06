import { PropsWithChildren } from 'react'

import { useFlag } from 'hooks'
import AppHeader from './AppHeader'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')

  return (
    <div
      style={{
        minHeight: 0,
        flex: 1,
        height: '100%',
        flexBasis: 0,
      }}
    >
      {navLayoutV2 && <AppHeader />}
      {children}
    </div>
  )
}

export default AppLayout
