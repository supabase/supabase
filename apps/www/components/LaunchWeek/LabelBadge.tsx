import React from 'react'

interface Props {
  text: string
  gradientText?: boolean
}

export default function LabelBadge({ text, gradientText = true }: Props) {
  return (
    <span className="bg-[#32313F] rounded px-1 py-[2px] text-xs">
      <span className={!gradientText ? '' : 'gradient-text-purple-500'}>{text}</span>
    </span>
  )
}
