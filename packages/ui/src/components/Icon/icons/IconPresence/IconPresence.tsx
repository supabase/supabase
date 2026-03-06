// DO NOT EDIT
// @ts-ignore
import IconBase from './../../IconBase'

const SvgComponent = () => (
  <>
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="m23.149 23.499 3.424 7.83a.5.5 0 0 0 .942-.074l.74-2.868a.5.5 0 0 1 .364-.36l3.039-.756a.5.5 0 0 0 .08-.943l-7.93-3.487a.5.5 0 0 0-.66.658Z"
    />
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      d="M24.544 32.746h-5.623a3 3 0 0 1-3-3V18.5a3 3 0 0 1 3-3h11.247a3 3 0 0 1 3 3v5.623"
      opacity={0.45}
    />
  </>
)

function IconPresence(props: any) {
  return <IconBase src={<SvgComponent />} viewBox="12.5 12 24 24" {...props} />
}

export default IconPresence
