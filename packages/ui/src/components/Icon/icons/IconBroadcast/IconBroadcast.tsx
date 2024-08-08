import IconBase from './../../IconBase'

const SvgComponent = () => (
  <>
    <path
      id="Ellipse 146"
      d="M17.3154 6.70312C18.6968 8.06227 19.5532 9.95249 19.5532 12.0426C19.5532 14.1326 18.6968 16.0229 17.3154 17.382M6.79102 6.70312C5.40966 8.06227 4.55322 9.95249 4.55322 12.0426C4.55322 14.1326 5.40966 16.0229 6.79102 17.382"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
      opacity={0.45}
    />
    <ellipse
      id="Ellipse 144"
      cx="12.0532"
      cy="12.0428"
      rx="3.00928"
      ry="3.00666"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
    <path
      id="Vector 96"
      d="M12.0747 15.0488L12.0747 23.9996"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
  </>
)

function IconBroadcast(props: any) {
  return <IconBase src={<SvgComponent />} viewBox="0 0 24 24" {...props} />
}

export default IconBroadcast
