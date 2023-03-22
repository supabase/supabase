import * as Accordion from '@radix-ui/react-accordion'
import { useRouter } from 'next/router'
import React from 'react'
import NavigationMenuGuideListItems from './NavigationMenuGuideListItems'

interface Props {
  id: string
  active: boolean
}
const NavigationMenuGuideList: React.FC<Props> = ({ id, active }) => {
  const router = useRouter()

  // get url
  const url = router.asPath

  // We need to decide how deep we want the menu to be for matching urls
  // if the links are really deep, we don't want to match all the way out
  // But we need to reach out further to make the structure of  /resources/postgres/  work
  // look at /resources/postgres/  vs /auth/phone-login for how these are different
  let firstLevelRoute
  if (url.includes('resources/postgres/')) {
    firstLevelRoute = url?.split('/')?.slice(0, 5)?.join('/')
  } else {
    firstLevelRoute = url?.split('/')?.slice(0, 4)?.join('/')
  }

  return (
    <Accordion.Root
      collapsible
      key={id}
      type="single"
      value={firstLevelRoute}
      className={[
        'transition-all ml-8 duration-150 ease-out',
        // enabled
        active && 'opacity-100 ml-0 delay-150',
        // level === 'home' && 'ml-12',

        // disabled
        // level !== 'home' && level !== id ? '-ml-8' : '',
        !active ? 'opacity-0 invisible absolute h-0 overflow-hidden' : '',
      ].join(' ')}
    >
      <NavigationMenuGuideListItems id={id} />
    </Accordion.Root>
  )
}

export default NavigationMenuGuideList
