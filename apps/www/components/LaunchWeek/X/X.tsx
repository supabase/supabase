import React from 'react'
import { cn } from 'ui'

interface Props {
  className?: string
}

const X = ({ className }: Props) => {
  return (
    <svg
      width="167"
      height="166"
      viewBox="0 0 167 166"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M83.2578 41.5977L41.8555 0.195312V0.629051H0.886507V41.5977H0.453125L41.8555 83L0.453125 124.402V165.805H41.8555L83.2578 124.402L124.66 165.805H166.062V124.402L124.66 83L166.062 41.5977V0.195312H124.66L83.2578 41.5977ZM83.2578 41.5977L124.66 83V41.5977H83.2578ZM83.2578 124.402L41.8555 83L41.8555 124.402H83.2578Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default X
