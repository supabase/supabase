import Image from 'next/image'
import React from 'react'
import { useTheme } from 'next-themes'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'

const OpenAIImage = ({ isHovered }: { isHovered: boolean }) => {
  const { resolvedTheme } = useTheme()

  const lineVariants = {
    animate: {
      strokeDashoffset: -38,
      transition: {
        ease: 'linear',
        duration: 3,
        yoyo: false,
        repeat: Infinity,
      },
    },

    initial: {
      strokeDashoffset: 0,
    },
  }

  const colors = {
    glow: resolvedTheme?.includes('dark') ? '#009C77' : '#00FFD9',
    rectStart: resolvedTheme?.includes('dark') ? '#17FDDF' : '#49615E',
    rectEnd: resolvedTheme?.includes('dark') ? '#10FFE0' : '#202020',
    cardBgStart: resolvedTheme?.includes('dark') ? '#171717' : 'white',
    cardBgEnd: resolvedTheme?.includes('dark') ? '#171717' : 'white',
    openAIStart: resolvedTheme?.includes('dark') ? '#89FFCA' : '#4FD7B6',
    openAIEnd: resolvedTheme?.includes('dark') ? '#D0FAE6' : '#4F7362',
    openAIStrokeStart: resolvedTheme?.includes('dark') ? '#A5FFD6' : '#5F5F5F',
    openAIStrokeEnd: resolvedTheme?.includes('dark') ? '#D0FAE6' : '#D6D6D6',
    openAIAltStart: resolvedTheme?.includes('dark') ? '#00DBA7' : '#00DBA7',
    openAIAltEnd: resolvedTheme?.includes('dark') ? '#171717' : '#DFDFDF',
  }

  const RenderedSVG = () => (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 285 211"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_f_4346_99959)">
        <ellipse cx="141.35" cy="170.604" rx="84" ry="83.5" fill={colors.glow} />
      </g>
      {/* rectangles grid */}
      <m.path
        d="M-75.6504 84.9567C-75.6504 71.7018 -64.9052 60.9567 -51.6504 60.9567H29.61C42.8649 60.9567 53.61 71.7018 53.61 84.9567V177.104C53.61 190.358 42.8648 201.104 29.61 201.104H-51.6504C-64.9052 201.104 -75.6504 190.358 -75.6504 177.104V84.9567Z"
        stroke="url(#paint0_radial_4346_99959)"
        strokeWidth="0.5"
        strokeDasharray="2.05 3.41"
        variants={lineVariants}
        initial={'initial'}
        animate={isHovered ? 'animate' : 'initial'}
      />

      <m.path
        d="M229.089 84.9567C229.089 71.7018 239.834 60.9567 253.089 60.9567H334.349C347.604 60.9567 358.349 71.7018 358.349 84.9567V177.104C358.349 190.358 347.604 201.104 334.349 201.104H253.089C239.834 201.104 229.089 190.358 229.089 177.104V84.9567Z"
        stroke="url(#paint1_radial_4346_99959)"
        strokeWidth="0.5"
        strokeDasharray="2.05 3.41"
        variants={lineVariants}
        initial={'initial'}
        animate={isHovered ? 'animate' : 'initial'}
      />

      <m.path
        d="M-75.6504 -64.8964C-75.6504 -78.1512 -64.9052 -88.8964 -51.6504 -88.8964H29.61C42.8649 -88.8964 53.61 -78.1512 53.61 -64.8964V27.2506C53.61 40.5055 42.8648 51.2506 29.61 51.2506H-51.6504C-64.9052 51.2506 -75.6504 40.5055 -75.6504 27.2506V-64.8964Z"
        stroke="url(#paint2_radial_4346_99959)"
        strokeWidth="0.5"
        strokeDasharray="2.05 3.41"
        variants={lineVariants}
        initial={'initial'}
        animate={isHovered ? 'animate' : 'initial'}
      />

      <m.path
        d="M229.089 -64.8964C229.089 -78.1512 239.834 -88.8964 253.089 -88.8964H334.35C347.604 -88.8964 358.35 -78.1512 358.35 -64.8964V27.2506C358.35 40.5055 347.604 51.2506 334.35 51.2506H253.089C239.834 51.2506 229.089 40.5055 229.089 27.2506V-64.8964Z"
        stroke="url(#paint3_radial_4346_99959)"
        strokeWidth="0.5"
        strokeDasharray="2.05 3.41"
        variants={lineVariants}
        initial={'initial'}
        animate={isHovered ? 'animate' : 'initial'}
      />

      <m.path
        d="M66.0322 -64.8964C66.0322 -78.1512 76.7774 -88.8964 90.0322 -88.8964H192.395C205.65 -88.8964 216.395 -78.1512 216.395 -64.8964V27.2506C216.395 40.5055 205.65 51.2506 192.395 51.2506H90.0323C76.7774 51.2506 66.0322 40.5055 66.0322 27.2506V-64.8964Z"
        stroke="url(#paint4_radial_4346_99959)"
        strokeWidth="0.5"
        strokeDasharray="2.05 3.41"
        variants={lineVariants}
        initial={'initial'}
        animate={isHovered ? 'animate' : 'initial'}
      />
      <g filter="url(#filter1_b_4346_99959)">
        <rect
          x="66.3496"
          y="62.1036"
          width="150"
          height="139"
          rx="24"
          fill="url(#paint5_radial_4346_99959)"
        />
        <rect
          x="65.8496"
          y="61.6036"
          width="151"
          height="140"
          rx="24.5"
          stroke="url(#paint8_linear_4346_99959)"
        />
      </g>
      <path
        d="M108.131 60.9898H174.594M141.335 61.2199V1.93152"
        stroke="url(#paint9_radial_4346_99959)"
        strokeWidth="3"
      />
      <g filter="url(#filter2_f_4346_99959)">
        <path
          d="M94.3145 60.9898H188.411M141.335 61.2199V1.93152"
          stroke="url(#paint10_radial_4346_99959)"
          strokeWidth="3"
        />
      </g>
      <defs>
        <filter
          id="filter0_f_4346_99959"
          x="-188.65"
          y="-158.896"
          width="660"
          height="659"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="123" result="effect1_foregroundBlur_4346_99959" />
        </filter>
        <filter
          id="filter1_b_4346_99959"
          x="52.3134"
          y="48.0674"
          width="178.072"
          height="167.072"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="6.51812" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_4346_99959" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_backgroundBlur_4346_99959"
            result="shape"
          />
        </filter>
        <filter
          id="filter2_f_4346_99959"
          x="90.3145"
          y="-2.06848"
          width="102.096"
          height="68.5583"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_4346_99959" />
        </filter>
        <radialGradient
          id="paint0_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.214 58.5257) rotate(90) scale(123.673 132.688)"
        >
          <stop stopColor={colors.rectStart} />
          <stop offset="1" stopColor={colors.rectEnd} />
        </radialGradient>
        <radialGradient
          id="paint1_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.214 58.5257) rotate(90) scale(123.673 132.688)"
        >
          <stop stopColor={colors.rectStart} />
          <stop offset="1" stopColor={colors.rectEnd} />
        </radialGradient>
        <radialGradient
          id="paint2_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.214 58.5257) rotate(90) scale(123.673 132.688)"
        >
          <stop stopColor={colors.rectStart} />
          <stop offset="1" stopColor={colors.rectEnd} />
        </radialGradient>
        <radialGradient
          id="paint3_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.214 58.5257) rotate(90) scale(123.673 132.688)"
        >
          <stop stopColor={colors.rectStart} />
          <stop offset="1" stopColor={colors.rectEnd} />
        </radialGradient>
        <radialGradient
          id="paint4_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.214 58.5257) rotate(90) scale(123.673 132.688)"
        >
          <stop stopColor={colors.rectStart} />
          <stop offset="1" stopColor={colors.rectEnd} />
        </radialGradient>
        <radialGradient
          id="paint5_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.35 88.487) rotate(90) scale(112.617 166.125)"
        >
          <stop stopColor={colors.cardBgStart} />
          <stop offset="1" stopColor={colors.cardBgEnd} />
        </radialGradient>
        <linearGradient
          id="paint8_linear_4346_99959"
          x1="106.634"
          y1="58.1285"
          x2="106.634"
          y2="134.096"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors.openAIAltStart} />
          <stop offset="1" stopColor={colors.openAIAltEnd} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient
          id="paint9_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.766 50.0377) rotate(90) scale(32.4982 32.4982)"
        >
          <stop stopColor="#3AFFE5" />
          <stop offset="1" stopColor="#38BBAA" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="paint10_radial_4346_99959"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(141.767 50.0377) rotate(90) scale(32.4982 32.4982)"
        >
          <stop stopColor="#00FFDE" />
          <stop offset="1" stopColor="#38BBAA" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )

  return (
    <>
      <div className="w-[44%] h-[44%] -translate-x-[2px] absolute z-10 inset-0 top-auto bottom-[16%] m-auto">
        <Image
          src={
            resolvedTheme?.includes('dark')
              ? '/images/product/vector/openai-logo-dark.png'
              : '/images/product/vector/openai-logo-light.png'
          }
          layout="fill"
          objectFit="contain"
          alt="OpenAi logo"
        />
      </div>
      <LazyMotion features={domAnimation}>
        <RenderedSVG />
      </LazyMotion>
    </>
  )
}

export default OpenAIImage
