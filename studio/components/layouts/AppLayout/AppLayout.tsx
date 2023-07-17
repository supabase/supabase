import { PropsWithChildren } from 'react'

import AppHeader from './AppHeader'
import { useFlag } from 'hooks'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')

  return (
    <div>
      {navLayoutV2 && <AppHeader />}
      {children}
    </div>
  )
}

export default AppLayout
