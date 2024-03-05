import { cn } from 'ui'
import styleHandler from '../../../ui/src/lib/theme/styleHandler'

export default function InputIconContainer({ icon, className }: any) {
  const __styles = styleHandler('inputIconContainer')
  return <div className={cn(__styles.base, className)}>{icon}</div>
}
