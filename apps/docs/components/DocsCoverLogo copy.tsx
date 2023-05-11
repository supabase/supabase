import React from 'react'
import { motion } from 'framer-motion'

const DocsCoverLogo = () => {
  const pathMotionConfig = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
    },
  }
  const logoMotionConfig = {
    initial: { fillOpacity: 0 },
    animate: { fillOpacity: 1 },
    transition: {
      duration: 0.5,
      delay: 0.2,
      ease: 'easeInOut',
    },
  }

  return (
    <div>
      <motion.svg
        width="126"
        height="115"
        viewBox="0 0 126 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M62.9805 3.01953V112.81"
          stroke="url(#paint0_radial_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M63.1301 96.1996C84.4207 96.1996 101.68 78.9402 101.68 57.6496C101.68 36.359 84.4207 19.0996 63.1301 19.0996C41.8395 19.0996 24.5801 36.359 24.5801 57.6496C24.5801 78.9402 41.8395 96.1996 63.1301 96.1996Z"
          stroke="var(--colors-scale11)"
          stroke-opacity="0.1"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M17.3902 29.9209C24.835 29.9209 30.8702 23.8857 30.8702 16.4409C30.8702 8.99614 24.835 2.96094 17.3902 2.96094C9.94536 2.96094 3.91016 8.99614 3.91016 16.4409C3.91016 23.8857 9.94536 29.9209 17.3902 29.9209Z"
          stroke="url(#paint1_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M17.3902 112.341C24.835 112.341 30.8702 106.306 30.8702 98.8609C30.8702 91.4161 24.835 85.3809 17.3902 85.3809C9.94536 85.3809 3.91016 91.4161 3.91016 98.8609C3.91016 106.306 9.94536 112.341 17.3902 112.341Z"
          stroke="url(#paint2_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M108.871 29.9209C116.315 29.9209 122.351 23.8857 122.351 16.4409C122.351 8.99614 116.315 2.96094 108.871 2.96094C101.426 2.96094 95.3906 8.99614 95.3906 16.4409C95.3906 23.8857 101.426 29.9209 108.871 29.9209Z"
          stroke="url(#paint3_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M108.871 112.341C116.315 112.341 122.351 106.306 122.351 98.8609C122.351 91.4161 116.315 85.3809 108.871 85.3809C101.426 85.3809 95.3906 91.4161 95.3906 98.8609C95.3906 106.306 101.426 112.341 108.871 112.341Z"
          stroke="url(#paint4_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M105.153 114H20.8469C9.88395 114 1 105.263 1 94.4818V20.5182C1 9.73681 9.88395 1 20.8469 1H105.153C116.116 1 125 9.73681 125 20.5182V94.4918C125 105.263 116.116 114 105.153 114Z"
          stroke="url(#paint5_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M108.87 112.46H17.39C9.86 112.46 3.75 106.35 3.75 98.8198V16.4798C3.75 8.94984 9.86 2.83984 17.39 2.83984H108.87C116.4 2.83984 122.51 8.94984 122.51 16.4798V98.8198C122.51 106.36 116.41 112.46 108.87 112.46Z"
          stroke="url(#paint6_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M30.8809 15.9609V99.0209"
          stroke="url(#paint7_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M63.1309 3.00977V112.29"
          stroke="url(#paint8_radial_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M75.4108 2.91992L7.30078 89.9399"
          stroke="url(#paint9_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M120.349 23.7305L50.2891 112.33"
          stroke="url(#paint10_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M95.3906 15.9609V99.0209"
          stroke="url(#paint11_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M109.52 29.8691H16.75"
          stroke="url(#paint12_radial_0_1)"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M3.88086 48.2109H122.381"
          stroke="url(#paint13_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M3.88086 66.4395H122.381"
          stroke="url(#paint14_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M109.52 85.4297H16.75"
          stroke="var(--colors-scale11)"
          stroke-opacity="0.1"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <motion.path
          initial={pathMotionConfig.initial}
          animate={pathMotionConfig.animate}
          transition={pathMotionConfig.transition as any}
          d="M63.7832 2.84453L63.7832 112.637"
          stroke="url(#paint15_linear_0_1)"
          stroke-opacity="0.5"
          stroke-width="0.7"
          stroke-miterlimit="10"
          stroke-linejoin="bevel"
        />
        <g filter="url(#filter0_d_0_1)">
          <motion.path
            initial={logoMotionConfig.initial}
            animate={logoMotionConfig.animate}
            transition={logoMotionConfig.transition as any}
            d="M63.38 87.5074C63.421 90.238 67.5503 91.4097 69.2501 89.2711L94.9 56.9962C97.9274 53.1868 95.2121 47.5687 90.3435 47.5687H63.9863L64.0274 26.7706C63.9865 24.04 60.0179 22.8681 58.3181 25.0069L33.2921 57.2817C30.2646 61.0912 32.9799 66.7092 37.8487 66.7092H63.0847L63.38 87.5074Z"
            fill="url(#paint16_linear_0_1)"
            fill-opacity="0.79"
            shape-rendering="crispEdges"
          />
          <motion.path
            initial={pathMotionConfig.initial}
            animate={pathMotionConfig.animate}
            transition={pathMotionConfig.transition as any}
            d="M63.4383 47.5676L63.9863 48.1166H90.3435C94.7544 48.1166 97.2124 53.2057 94.471 56.6553L68.8211 88.9302C68.1485 89.7764 66.9498 90.0131 65.8473 89.6894C64.746 89.3661 63.9437 88.5488 63.9279 87.4991L63.6326 66.7015L63.0847 66.1613H37.8487C33.4376 66.1613 30.9795 61.0723 33.7211 57.6226L33.7211 57.6227L33.7251 57.6175L58.7471 25.3478C58.7477 25.347 58.7484 25.3462 58.749 25.3454C59.4255 24.4965 60.5849 24.2683 61.6358 24.5871C62.6842 24.9051 63.4614 25.7139 63.4795 26.7744L63.4383 47.5676Z"
            stroke="url(#paint17_linear_0_1)"
            stroke-width="1.09591"
            stroke-miterlimit="10"
            stroke-linejoin="bevel"
            shape-rendering="crispEdges"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_0_1"
            x="27.6359"
            y="23.9023"
            width="72.9196"
            height="75.2399"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape" />
          </filter>
          <radialGradient
            id="paint0_radial_0_1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(63.4805 57.9145) rotate(90) scale(54.895 0.5)"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            id="paint1_linear_0_1"
            x1="20"
            y1="30"
            x2="10"
            y2="6.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint2_linear_0_1"
            x1="22.5"
            y1="85"
            x2="17"
            y2="103"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint3_linear_0_1"
            x1="111.48"
            y1="30"
            x2="116.5"
            y2="7.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint4_linear_0_1"
            x1="102.5"
            y1="85"
            x2="108.48"
            y2="103"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint5_linear_0_1"
            x1="61.2055"
            y1="114.331"
            x2="61.2055"
            y2="-3.47366"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0" />
            <stop offset="0.489583" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint6_linear_0_1"
            x1="61.4113"
            y1="112.781"
            x2="61.4113"
            y2="-1.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0" />
            <stop offset="0.489583" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint7_linear_0_1"
            x1="30.8809"
            y1="15.6861"
            x2="30.8809"
            y2="100.038"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0.1" />
            <stop offset="0.505208" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0.1" />
          </linearGradient>
          <radialGradient
            id="paint8_radial_0_1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(63.6309 57.6498) rotate(90) scale(54.64 0.5)"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            id="paint9_linear_0_1"
            x1="4"
            y1="93.5"
            x2="69.8982"
            y2="3.65884"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.3" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint10_linear_0_1"
            x1="116"
            y1="27"
            x2="50"
            y2="109"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.3" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint11_linear_0_1"
            x1="95.3906"
            y1="15.6861"
            x2="95.3906"
            y2="100.038"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0.1" />
            <stop offset="0.505208" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0.1" />
          </linearGradient>
          <radialGradient
            id="paint12_radial_0_1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(63.135 30.3691) rotate(90) scale(0.5 131.885)"
          >
            <stop stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            id="paint13_linear_0_1"
            x1="4"
            y1="47.7718"
            x2="122"
            y2="47.7718"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0.5" />
            <stop offset="0.505208" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0.5" />
          </linearGradient>
          <linearGradient
            id="paint14_linear_0_1"
            x1="4"
            y1="66.0003"
            x2="122"
            y2="66.0003"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0.5" />
            <stop offset="0.505208" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0.5" />
          </linearGradient>
          <linearGradient
            id="paint15_linear_0_1"
            x1="63.7832"
            y1="113"
            x2="63.7832"
            y2="1.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="var(--colors-scale10)" stop-opacity="0.1" />
            <stop offset="0.505208" stop-color="var(--colors-scale11)" stop-opacity="0.5" />
            <stop offset="1" stop-color="var(--colors-scale10)" stop-opacity="0.1" />
          </linearGradient>
          <linearGradient
            id="paint16_linear_0_1"
            x1="78.0606"
            y1="23.9023"
            x2="63.9941"
            y2="103.532"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#212121" />
            <stop offset="1" stop-color="white" stop-opacity="0.12" />
          </linearGradient>
          <linearGradient
            id="paint17_linear_0_1"
            x1="96.1709"
            y1="41.8866"
            x2="52.0239"
            y2="88.4504"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#868585" />
            <stop offset="0.208333" stop-color="#838383" />
            <stop offset="1" stop-color="#5A5A5A" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  )
}

export default DocsCoverLogo
