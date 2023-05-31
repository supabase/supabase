import React from 'react'
import { useTheme } from 'common/Providers'

function getRandomNumber(min: number, max: number) {
  var range = max - min
  var randomNumber = Math.random() * range + min

  return Math.round(randomNumber)
}

const DeployGlobally = ({ isHovered }: { isHovered: boolean }) => {
  const { isDarkMode } = useTheme()
  const ref = React.useRef<any>()
  const states = ['off', 'medium', 'high']
  const colors = {
    green: isDarkMode ? '#1CF7C3' : '#00B99F',
    gray: isDarkMode ? '#151918' : '#D3D3D3',
  }
  const indices = [
    3, 11, 14, 23, 27, 31, 35, 42, 48, 55, 62, 67, 71, 81, 83, 91, 98, 100, 103, 107, 110, 115,
  ]
  const transitionDuration = 250

  React.useEffect(() => {
    if (!isHovered) return
    const timeoutIds: any = []
    const circles = [...ref.current?.querySelectorAll('circle')]

    const interval = setInterval(() => {
      circles?.map((circle, index: any) => {
        const isMatch = indices.includes(index)

        if (!isMatch) {
          return
        }

        const nextState = states[Math.floor(Math.random() * states.length)]
        const currentState = circle.dataset.state

        const pulse =
          Math.random() > 0.2 &&
          ((currentState === 'off' && nextState === 'high') ||
            (currentState === 'off' && nextState === 'medium') ||
            (currentState === 'medium' && nextState === 'high'))

        if (pulse) {
          const delay = getRandomNumber(40, 90)

          timeoutIds.push(
            setTimeout(() => {
              circle.style.opacity = '0.3'
            }, delay)
          )

          timeoutIds.push(
            setTimeout(() => {
              circle.style.opacity = '1'
            }, transitionDuration + delay)
          )
        }

        if (currentState === 'high' && nextState === 'medium' && pulse) {
          circle.dataset.state = 'off'
        } else {
          circle.dataset.state = nextState
        }
      })
    }, 200)

    return () => {
      clearInterval(interval)
      timeoutIds.forEach(clearTimeout)
    }
  }, [isHovered])

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full z-10"
        style={{
          background: `radial-gradient(100% 50% at 50% 50%, transparent, var(--colors-scale2))`,
        }}
      />
      <svg
        ref={ref}
        width="100%"
        height="100%"
        viewBox="0 0 284 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="22.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="34.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="68.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="83.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="118.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="95.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="130.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="106.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="22.5" cy="38.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="38.5" r="2.5" fill={colors.green} />
        <circle cx="34.5" cy="38.5" r="2.5" fill={colors.gray} />
        <circle cx="68.5" cy="38.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="38.5" r="2.5" fill={colors.green} />
        <circle cx="22.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="49.5" r="2.5" fill={colors.green} />
        <circle cx="34.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="68.5" cy="49.5" r="2.5" fill={colors.green} />
        <circle cx="45.5" cy="49.5" r="2.5" fill={colors.green} />
        <circle cx="22.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="34.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="68.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="83.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="118.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="95.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="130.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="106.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="22.5" cy="105.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="105.5" r="2.5" fill={colors.green} />
        <circle cx="34.5" cy="105.5" r="2.5" fill={colors.green} />
        <circle cx="68.5" cy="105.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="105.5" r="2.5" fill={colors.gray} />
        <circle cx="22.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="34.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="68.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="116.5" r="2.5" fill={colors.green} />
        <circle cx="22.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="34.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="68.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="45.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="83.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="118.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="95.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="130.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="106.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="22.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="57.5" cy="171.5" r="2.5" fill={colors.green} />
        <circle cx="34.5" cy="171.5" r="2.5" fill={colors.green} />
        <circle cx="68.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="22.5" cy="182.5" r="2.5" fill={colors.green} />
        <circle cx="57.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="34.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="68.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="45.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="201.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="216.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="250.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="227.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="262.5" cy="27.5" r="2.5" fill={colors.green} />
        <circle cx="239.5" cy="27.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="38.5" r="2.5" fill={colors.green} />
        <circle cx="189.5" cy="38.5" r="2.5" fill={colors.gray} />
        <circle cx="166.5" cy="38.5" r="2.5" fill={colors.green} />
        <circle cx="201.5" cy="38.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="38.5" r="2.5" fill={colors.green} />
        <circle cx="154.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="49.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="201.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="49.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="201.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="216.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="250.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="227.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="262.5" cy="94.5" r="2.5" fill={colors.gray} />
        <circle cx="239.5" cy="94.5" r="2.5" fill={colors.green} />
        <circle cx="154.5" cy="105.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="105.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="105.5" r="2.5" fill={colors.gray} />
        <circle cx="201.5" cy="105.5" r="2.5" fill={colors.green} />
        <circle cx="178.5" cy="105.5" r="2.5" fill={colors.green} />
        <circle cx="154.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="116.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="201.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="116.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="189.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="201.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="178.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="216.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="250.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="227.5" cy="160.5" r="2.5" fill={colors.green} />
        <circle cx="262.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="239.5" cy="160.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="166.5" cy="171.5" r="2.5" fill={colors.green} />
        <circle cx="201.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="171.5" r="2.5" fill={colors.gray} />
        <circle cx="154.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="189.5" cy="182.5" r="2.5" fill={colors.green} />
        <circle cx="166.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="201.5" cy="182.5" r="2.5" fill={colors.gray} />
        <circle cx="178.5" cy="182.5" r="2.5" fill={colors.green} />
      </svg>
    </>
  )
}

export default DeployGlobally
