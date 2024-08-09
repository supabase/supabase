import React from 'react'

interface Props {
  text: string
  className?: string
}

export default function LabelBadge({ text, className }: Props) {
  return (
    <span className={['text-sm', className].join(' ')}>
      <span className="text-foreground-lighter">{text}</span>
    </span>
  )
}
