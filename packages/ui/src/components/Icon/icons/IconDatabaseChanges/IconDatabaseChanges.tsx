// DO NOT EDIT
// @ts-ignore
import IconBase from './../../IconBase'

const SvgComponent = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={25} height={24} fill="none">
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M20.307 12a7.807 7.807 0 0 1-7.807 7.808M4.693 12A7.807 7.807 0 0 1 12.5 4.193"
      opacity={0.45}
    />
    <circle
      cx={17.512}
      cy={6.971}
      r={3.723}
      stroke="currentColor"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
    />
    <path
      stroke="currentColor"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="m10.11 13.287 2.137 3.703-2.138 3.703H5.833L3.695 16.99l2.138-3.703h4.276Z"
    />
  </svg>
)

function IconDatabaseChanges(props: any) {
  return <IconBase src={<SvgComponent />} viewBox="0 0 25 24" {...props} />
}

export default IconDatabaseChanges
