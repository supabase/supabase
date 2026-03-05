import { cn } from 'ui'
import styleHandler from 'ui/src/lib/theme/styleHandler'

export default function InputIconContainer({
  icon,
  className,
  size,
}: {
  icon: React.ReactNode
  className?: string
  size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | null
}) {
  const __styles = styleHandler('inputIconContainer')
  return <div className={cn(__styles.base, __styles.size[size ?? 'small'], className)}>{icon}</div>
}
