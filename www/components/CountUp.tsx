import { useState, useEffect } from 'react'

type Props = {
  children: any,
  duration?: number
}

const easeOutQuad = (t:number) => t * ( 2 - t )
const frameDuration = 1000 / 60

const CountUp = (props: Props) => {
  const { children, duration = 2000 } = props
  const countTo = parseInt( children, 10 )
  const [ count, setCount ] = useState( 0 )

  useEffect(() => {
    let frame = 0
    const totalFrames = Math.round( duration / frameDuration )

    const counter = setInterval(() => {
			frame++
			const progress = easeOutQuad( frame / totalFrames )
			setCount( countTo * progress )

			if ( frame === totalFrames ) clearInterval( counter )
    }, frameDuration)

  }, [])

  return <span>{Math.floor(count)}</span>
}

export default CountUp