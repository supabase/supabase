import React from 'react'

interface Props {
  text: string
  className?: string
}

export default function LabelBadge({ text, className }: Props) {
  return (
    <span className={['bg-[#222428] rounded px-1 py-[1px] text-xs', className].join(' ')}>
      <span className="text-foreground-lighter">{text}</span>
    </span>
  )
}
