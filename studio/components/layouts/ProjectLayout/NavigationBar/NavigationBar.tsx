import { useParams } from 'common'
import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { IconHome } from 'ui'

import { useProjectContext } from '../ProjectContext'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'

const NavigationBar = ({}) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, project)
  const productRoutes = generateProductRoutes(projectRef, project)
  const otherRoutes = generateOtherRoutes(projectRef, project)

  return (
    <div
      className={[
        'flex w-14 flex-col justify-between overflow-y-hidden p-2',
        'border-r bg-body border-scale-500',
      ].join(' ')}
    >
      <ul className="flex flex-col space-y-2">
        <NavigationIconButton
          isActive={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Home',
            icon: <IconHome size={18} strokeWidth={2} />,
            link: `/project/${projectRef}`,
          }}
        />

        <div className="bg-scale-500 h-px w-full" />

        {toolRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}

        <div className="bg-scale-500 h-px w-full"></div>

        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="h-px w-full bg-scale-500"></div>
        {otherRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
      </ul>
    </div>
  )
}

export default NavigationBar
