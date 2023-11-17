import Lottie from 'lottie-light-react'
import loadingAnim from './LogoLoader.anim.json'

const LogoLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="w-28">
      <Lottie loop={true} autoplay={true} animationData={loadingAnim} />
    </div>
  </div>
)

export default LogoLoader
