import type { FloatingScreenConfig } from '../types'
import { CLIScreen } from './CLIScreen'
import { FloatingWindow } from './FloatingWindow'

const SCREEN_COMPONENTS: Record<string, React.ComponentType> = {
  cli: CLIScreen,
}

const SCREEN_SHOW_TITLE_BAR: Record<string, boolean> = {
  cli: false,
}

interface FloatingScreensProps {
  screens: FloatingScreenConfig[]
}

export function FloatingScreens({ screens }: FloatingScreensProps) {
  if (!screens.length) return null

  return (
    <>
      {screens.map((screen, i) => {
        const Content = SCREEN_COMPONENTS[screen.type]
        if (!Content) return null
        return (
          <FloatingWindow
            key={i}
            title={screen.title}
            showTitleBar={SCREEN_SHOW_TITLE_BAR[screen.type] ?? true}
            initialPosition={screen.initialPosition}
            width={screen.width}
            height={screen.height}
          >
            <Content />
          </FloatingWindow>
        )
      })}
    </>
  )
}
