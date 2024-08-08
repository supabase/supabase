import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { detectBrowser, isBrowser } from 'common'

const FunctionsVisual = () => {
  const isSafari = isBrowser && detectBrowser() === 'Safari'
  const initial = { x1: [0, 0], x2: [0, 0], y1: [0, 0], y2: [0, 0] }
  const gradientVariant1 = {
    initial,
    hover: {
      x1: [30, 200, 450],
      x2: [0, 50, 350],
      y1: [40, 0, 0],
      y2: [0, 0, 0],
    },
  }
  const gradientVariant2 = {
    initial,
    hover: {
      x1: [400, 50],
      x2: [300, -100],
      y1: [0, 0],
      y2: [0, 0],
    },
  }

  const LinearGradient = isSafari ? 'linearGradient' : motion.linearGradient
  const motionConfig1 = isSafari
    ? {}
    : {
        variants: gradientVariant1,
        transition: {
          duration: 0.75,
          ease: 'linear',
        },
      }
  const motionConfig2 = isSafari
    ? {}
    : {
        variants: gradientVariant2,
        transition: {
          duration: 0.75,
          ease: 'easeOut',
          delay: 0.25,
        },
      }

  return (
    <figure
      className="absolute inset-0 z-0"
      role="img"
      aria-label="Supabase Edge Functions visual composition"
    >
      <Image
        src="/images/index/products/edge-functions.png"
        alt="Supabase Edge Functions globe"
        fill
        sizes="100%"
        quality={100}
        priority
        className="absolute inset-0 object-cover object-center"
      />
      <svg
        viewBox="0 0 289 430"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        className="absolute w-[calc(100%+8px)] aspect-[1/1.44] inset-y-0 -inset-x-2 z-10 m-auto opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <g clipPath="url(#clip0_444_4697)">
          {/* animated line bottom */}
          <g filter="url(#filter0_f_444_4697)">
            <path
              d="M462.953 432.967C455.894 423.713 447.268 414.516 437.138 405.444C418.384 388.658 395.412 373.157 368.855 359.372C341.364 345.102 311.219 333.302 279.251 324.302C247.283 315.302 215.41 309.639 184.514 307.472C154.664 305.377 126.978 306.617 102.223 311.153C77.4525 315.692 56.8624 323.305 41.0193 333.781C24.5938 344.646 14.0196 358.124 9.59228 373.851C2.83761 397.848 11.1094 425.026 33.5152 452.463C44.2949 465.66 58.0947 478.584 74.5322 490.879C91.1154 503.28 110.072 514.809 130.89 525.145L131.149 524.624C89.3866 503.882 55.7825 478.803 33.9689 452.094C11.691 424.819 3.45077 397.815 10.1533 374.011C18.8422 343.145 51.5773 321.027 102.325 311.728C153.144 302.415 215.919 307.081 279.089 324.865C342.258 342.649 398.246 371.421 436.743 405.879C475.185 440.288 491.571 476.235 482.882 507.101C476.303 530.473 455.771 549.003 423.514 560.688L423.71 561.236C456.153 549.485 476.808 530.819 483.441 507.257C487.868 491.53 485.883 474.515 477.535 456.678C473.835 448.765 468.957 440.843 462.946 432.963L462.953 432.967Z"
              stroke="url(#paint0_linear_444_4697)"
              strokeWidth="1.48"
              strokeLinejoin="bevel"
            />
          </g>
          {/* animated line top */}
          <g filter="url(#filter1_f_444_4697)">
            <path
              d="M432.417 493.767C435.614 506.985 437.501 519.452 438.065 531.078L438.061 531.071C438.541 540.97 438.064 550.261 436.623 558.876C433.38 578.301 425.363 593.44 412.795 603.88C393.967 619.521 366.368 623.177 332.984 614.451L333.134 613.888C366.327 622.564 393.747 618.95 412.424 603.434C437.088 582.944 443.985 544.045 431.846 493.902C419.688 443.686 389.902 388.232 347.967 337.752C306.033 287.273 256.983 247.82 209.848 226.662C162.78 205.533 123.275 205.179 98.6104 225.669C82.4897 239.06 73.9031 260.43 73.4076 288L72.8153 288.5C73.2177 260.504 81.8831 238.808 98.2388 225.22C110.806 214.779 127.16 209.677 146.851 210.047C165.841 210.407 187.116 215.818 210.091 226.131C233.05 236.438 256.554 251.122 279.948 269.78C304.162 289.091 327.199 311.835 348.421 337.381C369.642 362.926 387.774 389.745 402.319 417.091C416.37 443.508 426.495 469.305 432.417 493.767Z"
              stroke="url(#paint1_linear_444_4697)"
              strokeWidth="1.48"
              strokeLinejoin="bevel"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_f_444_4697"
            x="3.68233"
            y="302.862"
            width="485.675"
            height="261.952"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="0.44088" result="effect1_foregroundBlur_444_4697" />
          </filter>
          <filter
            id="filter1_f_444_4697"
            x="69.1937"
            y="206.407"
            width="372.67"
            height="416.295"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="0.44088" result="effect1_foregroundBlur_444_4697" />
          </filter>
          <LinearGradient
            id="paint0_linear_444_4697"
            x1="0"
            y1="0"
            x2="348"
            y2="300"
            gradientUnits="userSpaceOnUse"
            {...motionConfig1}
          >
            <stop offset="0" stopColor="hsl(var(--border-strong))" stopOpacity="0" />
            <stop offset="0.2" stopColor="hsl(var(--brand-default))" />
            <stop offset="0.8" stopColor="hsl(var(--brand-default))" stopOpacity="0.0" />
            <stop offset="1" stopColor="hsl(var(--border-strong))" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient
            id="paint1_linear_444_4697"
            x1="0"
            y1="0"
            x2="348"
            y2="0"
            gradientUnits="userSpaceOnUse"
            {...motionConfig2}
          >
            <stop offset="0" stopColor="hsl(var(--border-strong))" stopOpacity="0" />
            <stop offset="0.1" stopColor="hsl(var(--brand-default))" stopOpacity="0.0" />
            <stop offset="0.9" stopColor="hsl(var(--brand-default))" />
            <stop offset="1" stopColor="hsl(var(--border-strong))" stopOpacity="0" />
          </LinearGradient>
        </defs>
      </svg>
    </figure>
  )
}

export default FunctionsVisual
