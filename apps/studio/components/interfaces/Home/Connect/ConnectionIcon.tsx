import {
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  ArrowDownCircle,
  ArrowUpRightFromCircleIcon,
} from 'lucide-react'

interface ConnectionIconProps {
  connection: any
}

// FPO — need to get the actual icons
const ConnectionIcon = ({ connection }: ConnectionIconProps) => {
  let iconComponent = null

  switch (connection) {
    case 'nextjs':
      iconComponent = <ArrowBigDown size={12} />
      break
    case 'vue':
      iconComponent = <ArrowBigLeft size={12} />
      break
    case 'prisma':
      iconComponent = <ArrowBigRight size={12} />
      break
    case 'drizzle':
      iconComponent = <ArrowBigUp size={12} />
      break
    case 'psql':
      iconComponent = <ArrowUpRightFromCircleIcon size={12} />
      break
    case 'php':
      iconComponent = <ArrowDownCircle size={12} />
      break
    default:
      // You can provide a default icon or empty element for unknown connections
      iconComponent = null
      break
  }

  return iconComponent
}

export default ConnectionIcon
