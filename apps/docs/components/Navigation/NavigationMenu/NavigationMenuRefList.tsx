import * as Accordion from '@radix-ui/react-accordion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconChevronLeft } from 'ui'
import * as NavItems from './NavigationMenu.constants'

import { find } from 'lodash'
import Image from 'next/image'
import { useTheme } from 'common/Providers'

// import apiCommonSections from '~/../../spec/common-client-libs-sections.json'

import RevVersionDropdown from '~/components/RefVersionDropdown'
import { useMenuActiveRefId, useMenuLevelId } from '~/hooks/useMenuState'
import { RefIdOptions, RefKeyOptions } from './NavigationMenu'
import NavigationMenuRefListItems from './NavigationMenuRefListItems'

import React from 'react'

interface INavigationMenuRefList {
  id: RefIdOptions
  lib: RefKeyOptions
  commonSections: any[] // to do type up

  // the keys of menu items that are allowed to be shown on the side menu
  // if undefined, we show all the menu items
  allowedClientKeys?: string[]
  active: boolean
}

const NavigationMenuRefList: React.FC<INavigationMenuRefList> = ({
  id,
  lib,
  commonSections,
  allowedClientKeys,
  active,
}) => {
  // console.log(filterIds)
  // console.log(modifierIds)

  // const level = useMenuLevelId()

  return (
    <div
      className={[
        'transition-all ml-8 duration-150 ease-out',
        // enabled
        active && 'opacity-100 ml-0 delay-150 h-auto',
        // move menu back to margin-left
        // level === 'home' && 'ml-12',
        // disabled
        // level !== 'home' && level !== id ? '-ml-8' : '',
        !active ? 'opacity-0 invisible absolute h-0 overflow-hidden' : '',
      ].join(' ')}
    >
      <NavigationMenuRefListItems
        id={id}
        lib={lib}
        commonSections={commonSections}
        allowedClientKeys={allowedClientKeys}
      />
    </div>
  )
}

export default React.memo(NavigationMenuRefList)
