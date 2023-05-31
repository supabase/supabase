import Image from 'next/image'
import React from 'react'
import { useTheme } from 'common/Providers'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'

const OpenAIImage = ({ isHovered }: { isHovered: boolean }) => {
  const { isDarkMode } = useTheme()

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
    glow: isDarkMode ? '#009C77' : '#00FFD9',
    rectStart: isDarkMode ? '#17FDDF' : '#49615E',
    rectEnd: isDarkMode ? '#10FFE0' : '#202020',
    cardBgStart: isDarkMode ? '#171717' : 'white',
    cardBgEnd: isDarkMode ? '#171717' : 'white',
    openAIStart: isDarkMode ? '#89FFCA' : '#4FD7B6',
    openAIEnd: isDarkMode ? '#D0FAE6' : '#4F7362',
    openAIStrokeStart: isDarkMode ? '#A5FFD6' : '#5F5F5F',
    openAIStrokeEnd: isDarkMode ? '#D0FAE6' : '#D6D6D6',
    openAIAltStart: isDarkMode ? '#00DBA7' : '#00DBA7',
    openAIAltEnd: isDarkMode ? '#171717' : '#DFDFDF',
  }

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full z-10"
        style={{
          background: `radial-gradient(100% 50% at 50% 50%, transparent, var(--colors-scale2))`,
        }}
      />
      <LazyMotion features={domAnimation}>
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
            <path
              d="M180.188 123.303C182.25 117.09 181.542 110.29 178.25 104.633C173.297 95.9785 163.329 91.5274 153.607 93.5984C149.269 88.7146 143.055 85.9327 136.532 85.9636C126.595 85.9636 117.765 92.3929 114.689 101.882C108.29 103.211 102.783 107.23 99.5524 112.917C94.5684 121.572 95.7067 132.452 102.383 139.871C100.321 146.084 101.029 152.884 104.321 158.509C109.274 167.195 119.242 171.646 128.995 169.575C133.302 174.459 139.517 177.272 146.039 177.241C155.976 177.241 164.806 170.812 167.882 161.322C174.281 159.993 179.788 155.975 182.988 150.287C188.003 141.633 186.864 130.752 180.188 123.334V123.303ZM173.112 107.632C175.081 111.093 175.82 115.143 175.143 119.068C175.02 118.976 174.774 118.852 174.62 118.759L156.53 108.25C155.607 107.724 154.468 107.724 153.546 108.25L132.348 120.552V111.526L149.854 101.357C158.007 96.6276 168.405 99.4404 173.112 107.632ZM132.348 126.394L141.27 121.201L150.192 126.394V136.749L141.27 141.942L132.348 136.749V126.394ZM136.502 91.9293C140.501 91.9293 144.347 93.3202 147.423 95.8858C147.3 95.9476 147.054 96.1021 146.869 96.1949L128.779 106.673C127.856 107.199 127.303 108.188 127.303 109.27V133.874L119.519 129.361V109.023C119.519 99.564 127.118 91.9293 136.532 91.8984L136.502 91.9293ZM104.721 115.915C106.721 112.454 109.828 109.795 113.581 108.404V130.01C113.581 131.092 114.135 132.05 115.058 132.607L136.225 144.878L128.41 149.422L110.936 139.283C102.813 134.554 100.014 124.107 104.721 115.915ZM109.49 155.573C107.49 152.142 106.782 148.062 107.459 144.136C107.582 144.229 107.828 144.353 107.982 144.445L126.072 154.955C126.995 155.48 128.133 155.48 129.056 154.955L150.223 142.653V151.678L132.717 161.817C124.565 166.515 114.166 163.733 109.459 155.573H109.49ZM146.07 171.275C142.101 171.275 138.224 169.884 135.179 167.319C135.302 167.257 135.579 167.102 135.732 167.01L153.822 156.531C154.745 156.006 155.33 155.017 155.299 153.935V129.361L163.083 133.874V154.182C163.083 163.641 155.453 171.306 146.07 171.306V171.275ZM177.881 147.289C175.881 150.751 172.743 153.409 169.021 154.769V133.163C169.021 132.081 168.467 131.092 167.544 130.567L146.346 118.265L154.13 113.752L171.636 123.89C179.788 128.619 182.557 139.067 177.85 147.258L177.881 147.289Z"
              fill="url(#paint6_linear_4346_99959)"
              fillOpacity="0.5"
            />
            <path
              d="M107.647 144.542C107.083 148.299 107.798 152.174 109.706 155.447L109.925 155.823H109.898C114.635 163.573 124.685 166.157 132.592 161.6L107.647 144.542ZM107.647 144.542C107.657 144.548 107.667 144.554 107.678 144.56C107.743 144.596 107.803 144.629 107.853 144.66L107.853 144.66L107.856 144.662L125.946 155.171L125.948 155.172C126.948 155.741 128.18 155.741 129.18 155.172L129.182 155.171L149.973 143.087V151.534L132.593 161.6L107.647 144.542ZM172.895 107.756C174.775 111.062 175.516 114.909 174.955 118.662C174.945 118.656 174.934 118.651 174.924 118.645C174.859 118.608 174.799 118.575 174.749 118.545L174.745 118.543L156.655 108.034L156.653 108.033C155.654 107.463 154.421 107.463 153.422 108.032L153.42 108.034L132.598 120.118V111.67L149.979 101.573C158.011 96.9138 168.257 99.6842 172.895 107.756ZM119.769 109.023C119.769 99.9082 126.928 92.5139 135.918 92.1614L135.9 92.1793H136.502C140.322 92.1793 143.999 93.4669 146.982 95.8483C146.902 95.8941 146.824 95.9377 146.757 95.9715L146.751 95.9748L146.744 95.9785L128.656 106.456C128.655 106.456 128.655 106.456 128.655 106.457C127.651 107.029 127.053 108.103 127.053 109.27V133.44L119.769 129.217V109.023ZM113.331 108.768V130.01C113.331 131.182 113.933 132.22 114.929 132.821L114.929 132.821L114.933 132.823L135.727 144.878L128.41 149.133L111.061 139.067C103.058 134.408 100.299 124.113 104.937 116.04C106.848 112.732 109.785 110.17 113.331 108.768ZM146.32 171.054V171.025H146.07C142.281 171.025 138.579 169.739 135.624 167.362C135.711 167.313 135.795 167.264 135.86 167.225C135.86 167.225 135.861 167.224 135.861 167.224L153.946 156.748C153.947 156.748 153.947 156.748 153.947 156.748C154.946 156.179 155.581 155.107 155.549 153.931V129.795L162.833 134.018V154.182C162.833 163.42 155.449 170.92 146.32 171.054ZM177.633 147.134L177.538 147.299L177.568 147.329C175.655 150.557 172.731 153.056 169.271 154.408V133.163C169.271 131.996 168.673 130.922 167.668 130.35C167.668 130.35 167.668 130.35 167.667 130.35L146.845 118.265L154.13 114.041L171.51 124.106C179.543 128.766 182.272 139.061 177.633 147.134ZM183.205 150.411C188.251 141.702 187.132 130.763 180.463 123.266C182.5 117.017 181.774 110.192 178.467 104.509C173.484 95.802 163.48 91.3038 153.697 93.3241C149.316 88.4541 143.077 85.6828 136.532 85.7136C126.534 85.7139 117.646 92.1512 114.496 101.667C108.087 103.041 102.577 107.086 99.3353 112.793C94.3221 121.499 95.4376 132.434 102.1 139.93C100.072 146.173 100.801 152.988 104.104 158.634C109.088 167.372 119.091 171.87 128.904 169.85C133.255 174.72 139.494 177.522 146.04 177.491C156.037 177.49 164.925 171.053 168.075 161.537C174.484 160.164 179.994 156.119 183.205 150.411ZM132.598 126.538L141.27 121.49L149.942 126.538V136.605L141.27 141.652L132.598 136.605V126.538Z"
              stroke="url(#paint7_linear_4346_99959)"
              strokeWidth="0.5"
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
              <feComposite
                in2="SourceAlpha"
                operator="in"
                result="effect1_backgroundBlur_4346_99959"
              />
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
              id="paint6_linear_4346_99959"
              x1="122.616"
              y1="105.824"
              x2="159.4"
              y2="172.323"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={colors.openAIStart} />
              <stop offset="1" stopColor={colors.openAIEnd} stopOpacity="0.6" />
            </linearGradient>
            <linearGradient
              id="paint7_linear_4346_99959"
              x1="122.616"
              y1="105.824"
              x2="159.4"
              y2="172.323"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={colors.openAIStrokeStart} />
              <stop offset="1" stopColor={colors.openAIStrokeEnd} stopOpacity="0.81" />
            </linearGradient>
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
      </LazyMotion>
    </>
  )
}

export default OpenAIImage
