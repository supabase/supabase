import IconBase from './../../IconBase'

const SvgComponent = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={15} height={14} fill="none">
    <path
      stroke="#A0A0A0"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M5.336.521v2.494m-1.866 0L1.34.819M3.47 4.74H1.026m9.2 5.094 3.328-.828a.5.5 0 0 0 .08-.943l-7.93-3.487a.5.5 0 0 0-.66.658l3.425 7.831a.5.5 0 0 0 .943-.075l.814-3.156Z"
    />
  </svg>
)

function IconRealtime(props: any) {
  return <IconBase src={<SvgComponent />} viewBox="0 0 15 14" {...props} />
}

export default IconRealtime
