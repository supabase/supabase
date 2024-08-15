import Image from 'next/image'
import React from 'react'

const ParityImage = () => (
  <div className="relative w-full h-full flex items-center justify-center text-sm">
    <Image
      src="/images/product/functions/lines-gradient-light.svg"
      alt=""
      fill
      sizes="100%"
      aria-hidden
      draggable={false}
      className="object-cover absolute z-0 inset-0 dark:hidden block"
    />
    <Image
      src="/images/product/functions/lines-gradient-dark.svg"
      alt=""
      fill
      sizes="100%"
      aria-hidden
      draggable={false}
      className="object-cover absolute z-0 inset-0 hidden dark:block"
    />
    <div className="relative z-10 p-4 font-mono bg-surface-200 border-2 border-dashed rounded-2xl justify-center items-center gap-1 flex">
      <div className="py-2 px-4 bg-alternative-200 rounded-lg shadow border flex-col justify-center items-center">
        <div className="text-foreground uppercase tracking-wide">Dev</div>
      </div>
      <svg width="32" height="7" viewBox="0 0 32 7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M27 5.74425C27 6.0204 27.3382 6.21566 27.5774 6.07759L31.4226 3.8575C31.6618 3.71943 31.6618 3.32891 31.4226 3.19084L27.5774 0.970752C27.3382 0.832681 27 1.02794 27 1.30409V5.74425ZM5 1.30409C5 1.02794 4.6618 0.832681 4.42265 0.970752L0.57735 3.19084C0.338204 3.32891 0.338204 3.71943 0.57735 3.8575L4.42265 6.07759C4.6618 6.21566 5 6.0204 5 5.74425V1.30409ZM27.5 3.02417H4.5V4.02417H27.5V3.02417Z"
          fill="currentColor"
        />
        <path
          d="M5 1.30409C5 1.02794 4.6618 0.832681 4.42265 0.970752L0.57735 3.19084C0.338204 3.32891 0.338204 3.71943 0.57735 3.8575L4.42265 6.07759C4.6618 6.21566 5 6.0204 5 5.74425V1.30409ZM27 5.74425C27 6.0204 27.3382 6.21566 27.5774 6.07759L31.4226 3.8575C31.6618 3.71943 31.6618 3.32891 31.4226 3.19084L27.5774 0.970752C27.3382 0.832681 27 1.02794 27 1.30409V5.74425ZM4.5 4.02417H27.5V3.02417H4.5V4.02417Z"
          fill="currentColor"
        />
      </svg>

      <div className="py-2 px-4 bg-alternative-200 rounded-lg shadow border flex-col justify-center items-center">
        <div className="text-foreground uppercase tracking-wide">Prod</div>
      </div>
    </div>
  </div>
)

export default ParityImage
