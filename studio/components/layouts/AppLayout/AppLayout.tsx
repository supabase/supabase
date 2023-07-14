import Image from 'next/image'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

import HeaderBar from './HeaderBar'

const AppLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div>
      <HeaderBar />
      {children}
    </div>
  )
}

export default AppLayout
