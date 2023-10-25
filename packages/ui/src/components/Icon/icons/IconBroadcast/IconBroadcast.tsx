import IconBase from './../../IconBase'

const SvgComponent = () => (
  <>
    <path
      stroke="#4CC38A"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M15.695 8.824a4.48 4.48 0 0 1 1.358 3.219 4.48 4.48 0 0 1-1.358 3.218M9.411 8.824a4.48 4.48 0 0 0-1.358 3.219 4.48 4.48 0 0 0 1.358 3.218"
    />
    <path
      stroke="#85E0B7"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M15.695 15.26a4.487 4.487 0 0 1-3.142 1.278 4.487 4.487 0 0 1-3.142-1.277M15.695 8.824a4.487 4.487 0 0 0-3.142-1.277 4.487 4.487 0 0 0-3.142 1.277"
      opacity={0.33}
    />
    <path
      stroke="#4CC38A"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M17.815 6.703a7.467 7.467 0 0 1 2.238 5.34c0 2.09-.856 3.98-2.238 5.339M7.291 6.703a7.468 7.468 0 0 0-2.238 5.34c0 2.09.857 3.98 2.238 5.339"
    />
    <path
      stroke="#85E0B7"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M17.815 17.382a7.479 7.479 0 0 1-5.262 2.154 7.48 7.48 0 0 1-5.262-2.154M17.815 6.703a7.479 7.479 0 0 0-5.262-2.154A7.48 7.48 0 0 0 7.29 6.703"
      opacity={0.33}
    />
    <ellipse
      cx={12.553}
      cy={12.043}
      stroke="#4CC38A"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      rx={1.5}
      ry={1.499}
    />
    <path
      stroke="#4CC38A"
      strokeLinejoin="bevel"
      strokeMiterlimit={10}
      d="M12.532 13.28 12.575 24"
    />
  </>
)

function IconBroadcast(props: any) {
  return <IconBase src={<SvgComponent />} viewBox="0 0 25 25" {...props} />
}

export default IconBroadcast
