'use client'

import { createContext, useContext } from 'react'
import { type AnchorProviderProps } from 'ui-patterns/Toc'
import { proxy, useSnapshot } from 'valtio'

const TocAnchorsContext = createContext<AnchorProviderProps | undefined>(undefined)

const useTocAnchors = () => {
  const context = useContext(TocAnchorsContext)
  if (!context) {
    throw new Error('useTocAnchors must be used within an TocAnchorsContext')
  }
  return context
}

const useTocRerenderTrigger = () => {
  const { toggleRenderFlag } = useSnapshot(tocRenderSwitch)
  return toggleRenderFlag
}

const tocRenderSwitch = proxy({
  renderFlag: 0,
  toggleRenderFlag: () => void (tocRenderSwitch.renderFlag = (tocRenderSwitch.renderFlag + 1) % 2),
})

const useSubscribeTocRerender = () => {
  const { renderFlag } = useSnapshot(tocRenderSwitch)
  return void renderFlag // Prevent it from being detected as unused code
}

export { TocAnchorsContext, useSubscribeTocRerender, useTocAnchors, useTocRerenderTrigger }
