import React from 'react'
import { Loader2 } from 'lucide-react'
import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'

interface Props {
  children: React.ReactNode
  active: boolean
  isFullHeight?: boolean
}
/**
 * A loading component that overlays a spinner on its children.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be overlaid.
 * @param {boolean} props.active - If `true`, the loading spinner will be active.
 * @param {boolean} [props.isFullHeight=false] - If `true`, the component will take up the full height of its container.
 * @returns {React.ReactElement} The loading component.
 */
export default function Loading({ children, active, isFullHeight = false }: Props) {
  const __styles = styleHandler('loading')

  let classNames = [__styles.base]

  let contentClasses = [__styles.content.base]

  if (active) {
    contentClasses.push(__styles.content.active)
  }

  let spinnerClasses = [__styles.spinner]

  return (
    <div className={cn(classNames.join(' '), isFullHeight && 'h-full')}>
      <div className={cn(contentClasses.join(' '), isFullHeight && 'h-full')}>{children}</div>
      {active && <Loader2 size={24} className={spinnerClasses.join(' ')} />}
    </div>
  )
}
