import { useTheme } from 'next-themes'

export interface IconProps {
  isSelected?: boolean
}

export const ServiceRoleIcon = ({ isSelected = false }: IconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <svg width="53" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity={isSelected ? '1' : '.5'}>
        <rect
          x="37.161"
          y=".53"
          width="15"
          height="15"
          rx="5.5"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <path d="M1 10.53h32.214" stroke="#33A7E9" strokeLinecap="round" strokeDasharray="2 2" />
        <rect
          x="15.964"
          y=".53"
          width="9"
          height="15"
          rx="4.5"
          stroke={resolvedTheme === 'light' ? '#7E868C' : '#7E7E7E'}
        />
        <path d="M1 5.53h32.214" stroke="#33A7E9" strokeLinecap="round" strokeDasharray="2 2" />
      </g>
    </svg>
  )
}

export const AnonIcon = ({ isSelected = false }: IconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <svg width="53" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity={isSelected ? '1' : '.5'}>
        <path
          d="M1 4.994a.5.5 0 0 0 0 1v-1Zm16.218 1h.5v-1h-.5v1ZM1 5.994h1.014v-1H1v1Zm3.04 0h2.028v-1H4.041v1Zm4.056 0h2.027v-1H8.096v1Zm4.054 0h2.027v-1H12.15v1Zm4.055 0h1.013v-1h-1.013v1Z"
          fill={resolvedTheme === 'light' ? '#7E868C' : '#7E7E7E'}
        />
        <path
          d="m15.92 12.56 9.04-9.04"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <rect
          x="15.964"
          y=".494"
          width="9"
          height="15"
          rx="4.5"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <rect
          x="37.161"
          y=".744"
          width="15"
          height="15"
          rx="5.5"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <path d="M1 10.494h32.214" stroke="#33A7E9" strokeLinecap="round" strokeDasharray="2 2" />
        <path
          d="M15.96 7.562 22.568.956M19.049 14.885l5.957-5.958"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
      </g>
    </svg>
  )
}

export const AuthenticatedIcon = ({ isSelected = false }: IconProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <svg width="68" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity={isSelected ? '1' : '.5'}>
        <path
          d="M15.63 5.156a.5.5 0 1 0 0 1v-1Zm16.218 1h.5v-1h-.5v1Zm-16.218 0h1.013v-1H15.63v1Zm3.04 0h2.028v-1h-2.027v1Zm4.055 0h2.028v-1h-2.028v1Zm4.055 0h2.027v-1H26.78v1Zm4.055 0h1.013v-1h-1.013v1Z"
          fill={resolvedTheme === 'light' ? '#7E868C' : '#7E7E7E'}
        />
        <path
          d="m30.55 12.722 9.04-9.04"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <rect
          x="30.594"
          y=".656"
          width="9"
          height="15"
          rx="4.5"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <rect
          x="51.791"
          y=".906"
          width="15"
          height="15"
          rx="5.5"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <path
          d="M15.63 10.656h32.214"
          stroke="#33A7E9"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        <path
          d="m30.59 7.724 6.607-6.606M33.679 15.047l5.957-5.958"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
        />
        <path
          d="M12.666 14.281v-1.333A2.667 2.667 0 0 0 10 10.28H6a2.667 2.667 0 0 0-2.667 2.667v1.333M8 7.615A2.667 2.667 0 1 0 8 2.28a2.667 2.667 0 0 0 0 5.334Z"
          stroke={resolvedTheme === 'light' ? '#11181C' : '#EDEDED'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
