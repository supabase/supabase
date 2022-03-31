import { FC, ReactNode } from 'react'
import { isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import BaseLayout from '../'
import ProductMenu from 'components/ui/ProductMenu'
import { generateSettingsMenu } from './SettingsMenu.utils'
import { useRouter } from 'next/router'

interface Props {
  title?: string
  children: ReactNode
}

const SettingsLayout: FC<Props> = ({ title, children }) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref ?? 'default'

  const router = useRouter()
  const page = router.pathname.split('/')[4]
  return (
    <BaseLayout
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={generateSettingsMenu(projectRef)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default observer(SettingsLayout)
