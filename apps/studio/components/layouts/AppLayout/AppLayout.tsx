import { PropsWithChildren } from 'react'

import { useFlag } from 'hooks'
import AppHeader from './AppHeader'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  const navLayoutV2 = useFlag('navigationLayoutV2')

  return (
    <div className="h-full min-h-[0px] basis-0 flex-1">
      {navLayoutV2 && <AppHeader />}
      {children}
    </div>
  )
}

export default AppLayout
