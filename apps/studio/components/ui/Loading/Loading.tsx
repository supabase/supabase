import Lottie from 'lottie-light-react'
import loadingAnim from './Loading.anim.json'

const Connecting = () => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="w-28">
      <Lottie loop={true} autoplay={true} animationData={loadingAnim} />
    </div>
  </div>
)

export default Connecting
