import React from 'react'

interface AiIconProps {
  className?: string
}

export const AiIcon = ({ className = 'text-brand-900' }: AiIconProps) => (
  <svg
    className={`w-6 h-6 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
  >
    <path
      stroke="#4CC38A"
      strokeMiterlimit="10"
      d="m10.618 11.832-2.283 2.657a.5.5 0 0 1-.88-.325v-3.98H2.728a1 1 0 0 1-.777-1.628l5.402-6.682a.5.5 0 0 1 .889.314v3.915h5.043a1 1 0 0 1 .766 1.642l-1.373 1.638"
    />
    <path
      stroke="#4CC38A"
      strokeLinejoin="bevel"
      strokeMiterlimit="10"
      d="m12.232 14.15.418-1.254a2.383 2.383 0 0 1 1.507-1.507l1.253-.417-1.253-.418a2.383 2.383 0 0 1-1.508-1.507l-.417-1.253-.417 1.253a2.383 2.383 0 0 1-1.507 1.507l-1.253.418 1.253.417a2.383 2.383 0 0 1 1.507 1.507l.417 1.253Z"
    />
  </svg>
)

export const AiIconChat = () => (
  <div
    className="w-7 h-7
    bg-gradient-to-r from-brand-900 to-brand-800

    ring-brand-600
    ring-1

    rounded-md border border-brand-400 flex items-center justify-center
    shadow-sm
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-4 h-4 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  </div>
)
