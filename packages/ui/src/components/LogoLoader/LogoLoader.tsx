import styles from './loading-anim.module.css'

const LogoLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="w-28">
      <svg
        width="60"
        height="62"
        viewBox="0 0 60 62"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles['loading']}
      >
        <path
          d="M30.2571 4.12811L30.257 4.12389C30.2133 1.21067 26.5349 -0.034778 24.7224 2.24311L1.76109 31.0996C-1.21104 34.8348 1.45637 40.34 6.23131 40.34H29.4845L29.7563 58.4432C29.8 61.3564 33.4783 62.6016 35.2908 60.324L34.8996 60.0127L35.2908 60.324L58.2521 31.4674C61.2241 27.7322 58.5568 22.227 53.782 22.227H30.3762L30.2571 4.12811Z"
          stroke="hsl(var(--brand-default))"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  </div>
)

export default LogoLoader
