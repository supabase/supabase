import React, { type PropsWithChildren } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'

const DocsCoverLogo = (props: PropsWithChildren) => {
  const pathMotionConfig = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: {
      duration: 1,
      delay: 0.2,
      ease: [0.5, 0.11, 0.13, 1],
    },
  }
  const logoMotionConfig = {
    initial: { fillOpacity: 0 },
    animate: { fillOpacity: 1 },
    transition: {
      duration: 1,
      delay: 0.5,
      ease: [0.25, 0.25, 0, 1],
    },
  }

  return (
    <div className="w-[60px] md:w-[150px] [&_svg]" {...props}>
      <LazyMotion features={domAnimation}>
        <m.svg
          width="100%"
          height="100%"
          viewBox="0 0 250 228"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M124.951 5.03906V224.602"
            stroke="url(#paint0_radial_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M125.25 191.383C167.828 191.383 202.344 156.867 202.344 114.289C202.344 71.7115 167.828 37.1953 125.25 37.1953C82.6724 37.1953 48.1562 71.7115 48.1562 114.289C48.1562 156.867 82.6724 191.383 125.25 191.383Z"
            stroke="hsl(var(--foreground-light))"
            strokeOpacity="0.1"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M33.7782 58.8377C48.6666 58.8377 60.7361 46.7682 60.7361 31.8798C60.7361 16.9913 48.6666 4.92188 33.7782 4.92188C18.8898 4.92188 6.82031 16.9913 6.82031 31.8798C6.82031 46.7682 18.8898 58.8377 33.7782 58.8377Z"
            stroke="url(#paint1_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M33.7782 223.664C48.6666 223.664 60.7361 211.594 60.7361 196.706C60.7361 181.817 48.6666 169.748 33.7782 169.748C18.8898 169.748 6.82031 181.817 6.82031 196.706C6.82031 211.594 18.8898 223.664 33.7782 223.664Z"
            stroke="url(#paint2_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M216.724 58.8377C231.612 58.8377 243.681 46.7682 243.681 31.8798C243.681 16.9913 231.612 4.92188 216.724 4.92188C201.835 4.92188 189.766 16.9913 189.766 31.8798C189.766 46.7682 201.835 58.8377 216.724 58.8377Z"
            stroke="url(#paint3_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M216.724 223.664C231.612 223.664 243.681 211.594 243.681 196.706C243.681 181.817 231.612 169.748 216.724 169.748C201.835 169.748 189.766 181.817 189.766 196.706C189.766 211.594 201.835 223.664 216.724 223.664Z"
            stroke="url(#paint4_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M209.29 226.982H40.6907C18.7665 226.982 1 209.51 1 187.949V40.0333C1 18.4722 18.7665 1 40.6907 1H209.29C231.214 1 248.981 18.4722 248.981 40.0333V187.969C248.981 209.51 231.214 226.982 209.29 226.982Z"
            stroke="url(#paint5_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M216.724 223.903H33.7779C18.719 223.903 6.5 211.684 6.5 196.625V31.9576C6.5 16.8987 18.719 4.67969 33.7779 4.67969H216.724C231.782 4.67969 244.001 16.8987 244.001 31.9576V196.625C244.001 211.704 231.802 223.903 216.724 223.903Z"
            stroke="url(#paint6_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M60.7578 30.9199V197.027"
            stroke="url(#paint7_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M125.252 5.01953V223.562"
            stroke="url(#paint8_radial_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M149.809 4.83984L13.5996 178.866"
            stroke="url(#paint9_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M239.679 46.457L99.5703 223.643"
            stroke="url(#paint10_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M189.766 30.9199V197.027"
            stroke="url(#paint11_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M218.024 58.7344H32.498"
            stroke="url(#paint12_radial_0_1)"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M6.76172 95.4141H243.743"
            stroke="url(#paint13_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M6.76172 131.869H243.743"
            stroke="url(#paint14_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M218.024 169.846H32.498"
            stroke="hsl(var(--foreground-light))"
            strokeOpacity="0.1"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <m.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M126.559 4.6867L126.559 224.254"
            stroke="url(#paint15_linear_0_1)"
            strokeOpacity="0.5"
            strokeWidth="0.7"
            strokeMiterlimit="10"
            strokeLinejoin="bevel"
          />
          <g filter="url(#filter0_d_0_1)">
            <m.path
              initial={logoMotionConfig.initial}
              animate={logoMotionConfig.animate}
              transition={logoMotionConfig.transition as any}
              d="M125.751 174.003C125.833 179.464 134.091 181.807 137.49 177.53L188.786 112.985C194.84 105.367 189.41 94.1317 179.674 94.1317H126.964L127.046 52.5389C126.964 47.078 119.027 44.7344 115.628 49.0116L65.5801 113.556C59.5255 121.175 64.9558 132.41 74.6925 132.41H125.161L125.751 174.003Z"
              fill="url(#paint16_linear_0_1)"
              fillOpacity="0.79"
              shapeRendering="crispEdges"
            />
            <m.path
              initial={pathMotionConfig.initial}
              animate={pathMotionConfig.animate}
              transition={pathMotionConfig.transition as any}
              d="M126.964 94.6797L126.416 94.1306L126.498 52.5425C126.459 50.117 124.68 48.3327 122.422 47.6478C120.162 46.9621 117.586 47.432 116.059 49.3499C116.059 49.3508 116.058 49.3516 116.057 49.3525L66.0131 113.892L66.0091 113.897C60.2405 121.156 65.4135 131.862 74.6925 131.862H125.161L125.709 132.402L126.299 173.995L126.299 173.995M126.964 94.6797L125.751 174.003L126.299 173.995M126.964 94.6797H179.674C188.953 94.6797 194.126 105.386 188.357 112.644L137.061 177.189C135.539 179.104 132.883 179.583 130.531 178.892C128.18 178.202 126.336 176.41 126.299 173.995M126.964 94.6797L126.299 173.995"
              stroke="url(#paint17_linear_0_1)"
              strokeWidth="1.09591"
              strokeMiterlimit="10"
              strokeLinejoin="bevel"
              shapeRendering="crispEdges"
            />
          </g>
          <defs>
            <filter
              id="filter0_d_0_1"
              x="58.6515"
              y="46.8027"
              width="137.062"
              height="141.703"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="4.38364" />
              <feGaussianBlur stdDeviation="2.19182" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_0_1"
                result="shape"
              />
            </filter>
            <radialGradient
              id="paint0_radial_0_1"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(125.451 114.82) rotate(90) scale(109.781 0.5)"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="paint1_linear_0_1"
              x1="38.9975"
              y1="58.9958"
              x2="18.999"
              y2="11.9994"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_0_1"
              x1="43.9971"
              y1="168.986"
              x2="32.998"
              y2="204.984"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint3_linear_0_1"
              x1="221.943"
              y1="58.9958"
              x2="231.981"
              y2="13.9993"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint4_linear_0_1"
              x1="203.983"
              y1="168.986"
              x2="215.943"
              y2="204.984"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint5_linear_0_1"
              x1="121.402"
              y1="227.645"
              x2="121.402"
              y2="-7.94661"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
              <stop offset="0.489583" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint6_linear_0_1"
              x1="121.814"
              y1="224.545"
              x2="121.814"
              y2="-3.99932"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
              <stop offset="0.489583" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint7_linear_0_1"
              x1="60.7578"
              y1="30.3703"
              x2="60.7578"
              y2="199.061"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
              <stop offset="0.505208" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient
              id="paint8_radial_0_1"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(125.752 114.291) rotate(90) scale(109.271 0.5)"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="paint9_linear_0_1"
              x1="6.99856"
              y1="0"
              x2="200"
              y2="6.31757"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.3" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint10_linear_0_1"
              x1="200"
              y1="100"
              x2="0"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.3" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint11_linear_0_1"
              x1="189.766"
              y1="30.3703"
              x2="189.766"
              y2="199.061"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
              <stop offset="0.505208" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient
              id="paint12_radial_0_1"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(125.261 59.2344) rotate(90) scale(0.5 263.749)"
            >
              <stop stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="paint13_linear_0_1"
              x1="6.99998"
              y1="94.9749"
              x2="242.982"
              y2="94.9749"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.5" />
              <stop offset="0.505208" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient
              id="paint14_linear_0_1"
              x1="6.99998"
              y1="131.43"
              x2="242.982"
              y2="131.43"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.5" />
              <stop offset="0.505208" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient
              id="paint15_linear_0_1"
              x1="126.559"
              y1="224.98"
              x2="126.559"
              y2="1.99785"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
              <stop offset="0.505208" stopColor="hsl(var(--foreground-light))" stopOpacity="0.5" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient
              id="paint16_linear_0_1"
              x1="155.11"
              y1="46.8027"
              x2="126.979"
              y2="206.049"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#212121" />
              <stop offset="1" stopColor="white" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient
              id="paint17_linear_0_1"
              x1="191.328"
              y1="82.7684"
              x2="103.041"
              y2="175.889"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#868585" />
              <stop offset="0.208333" stopColor="#838383" />
              <stop offset="1" stopColor="#5A5A5A" />
            </linearGradient>
          </defs>
        </m.svg>
      </LazyMotion>
    </div>
  )
}

export default DocsCoverLogo
