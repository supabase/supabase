import React from 'react'

interface Props {
  text: string
  gradientText?: boolean
}

export default function LabelBadge({ text, gradientText = false }: Props) {
  return (
    <span className="bg-[#32313F] rounded px-1 py-[2px] text-xs">
      <span className={!gradientText ? 'text-[#D87BF5]' : 'gradient-text-purple-500'}>{text}</span>
    </span>
  )
}
