import React from 'react'

const SBLogoVisual = ({ className }: { className: string }) => {
  return (
    <div className={['w-[300px] h-[300px]', className].join(' ')}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 531 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_di_4455_109077)">
          <g filter="url(#filter1_i_4455_109077)">
            <path
              d="M289.539 399.102C281.926 408.585 266.491 403.389 266.307 391.281L263.625 214.188H384.012C405.817 214.188 417.978 239.099 404.419 255.991L289.539 399.102Z"
              fill="#060F13"
            />
          </g>
          <path
            opacity="0.4"
            d="M360.5 214.188H384.01C396.696 214.188 406.118 222.62 409.11 233"
            stroke="url(#paint0_linear_4455_109077)"
          />
          <path
            d="M240.58 114.14C248.193 104.656 263.629 109.852 263.812 121.961L264.987 299.054H146.107C124.301 299.054 112.14 274.143 125.699 257.251L240.58 114.14Z"
            fill="#060F13"
          />
          <path opacity="0.4" d="M177 194.5L237.5 119" stroke="url(#paint1_linear_4455_109077)" />
        </g>
        <defs>
          <filter
            id="filter0_di_4455_109077"
            x="0"
            y="-70.7578"
            width="530.117"
            height="534.758"
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
            <feOffset dy="-40" />
            <feGaussianBlur stdDeviation="50" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0901961 0 0 0 0 0.196235 0 0 0 0 0.294118 0 0 0 1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_4455_109077"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_4455_109077"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.944253 0 0 0 0 0.94636 0 0 0 0 0.947413 0 0 0 0.3 0"
            />
            <feBlend mode="normal" in2="shape" result="effect2_innerShadow_4455_109077" />
          </filter>
          <filter
            id="filter1_i_4455_109077"
            x="263.625"
            y="214.188"
            width="147.492"
            height="189.812"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="1" />
            <feGaussianBlur stdDeviation="0.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.945098 0 0 0 0 0.94902 0 0 0 0 0.94902 0 0 0 0.12 0"
            />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_4455_109077" />
          </filter>
          <linearGradient
            id="paint0_linear_4455_109077"
            x1="408"
            y1="229"
            x2="387.844"
            y2="242.622"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#CDE4E4" stopOpacity="0" />
            <stop offset="0.489583" stopColor="#CDE4E4" />
            <stop offset="1" stopColor="#CDE4E4" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_4455_109077"
            x1="236"
            y1="121"
            x2="179.5"
            y2="192"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#CDE4E4" stopOpacity="0" />
            <stop offset="0.489583" stopColor="#CDE4E4" />
            <stop offset="1" stopColor="#CDE4E4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default SBLogoVisual
