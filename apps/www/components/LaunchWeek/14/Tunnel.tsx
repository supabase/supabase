import Image from 'next/image'
import React from 'react'
import tunnelImage from './assets/tunnel-bg.png'

interface TunnelProps {
  width?: number
  height?: number
  className?: string
}

export const Tunnel: React.FC<TunnelProps> = ({ className = '' }) => {
  return (
    <Image
      src={tunnelImage}
      alt=""
      width="1120"
      height="380"
      className="w-full h-auto min-w-[700px]"
    />
  )
}
