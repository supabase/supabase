import React from 'react'

function getRandomNumber(min: number, max: number) {
  // Calculating the range
  var range = max - min

  // Generating a random number within the range
  var randomNumber = Math.random() * range + min

  // Rounding the random number to the nearest integer
  return Math.round(randomNumber)
}

const DeployGlobally = ({ isHovered }: { isHovered: boolean }) => {
  const ref = React.useRef<any>()
  const states = ['off', 'medium', 'high']
  const indices = [
    3, 11, 14, 23, 27, 35, 42, 48, 55, 62, 67, 71, 81, 83, 91, 98, 103, 107, 110, 115,
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
          const delay = getRandomNumber(50, 150)

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
    }, 1000)

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
        <circle cx="22.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="34.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="68.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="83.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="118.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="95.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="130.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="106.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="22.5" cy="38.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="38.5" r="2.5" fill="#1CF7C3" />
        <circle cx="34.5" cy="38.5" r="2.5" fill="#151918" />
        <circle cx="68.5" cy="38.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="38.5" r="2.5" fill="#1CF7C3" />
        <circle cx="22.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="49.5" r="2.5" fill="#1CF7C3" />
        <circle cx="34.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="68.5" cy="49.5" r="2.5" fill="#1CF7C3" />
        <circle cx="45.5" cy="49.5" r="2.5" fill="#1CF7C3" />
        <circle cx="22.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="34.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="68.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="83.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="118.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="95.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="130.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="106.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="22.5" cy="105.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="105.5" r="2.5" fill="#1CF7C3" />
        <circle cx="34.5" cy="105.5" r="2.5" fill="#1CF7C3" />
        <circle cx="68.5" cy="105.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="105.5" r="2.5" fill="#151918" />
        <circle cx="22.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="34.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="68.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="116.5" r="2.5" fill="#1CF7C3" />
        <circle cx="22.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="34.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="68.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="45.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="83.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="118.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="95.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="130.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="106.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="22.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="57.5" cy="171.5" r="2.5" fill="#1CF7C3" />
        <circle cx="34.5" cy="171.5" r="2.5" fill="#1CF7C3" />
        <circle cx="68.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="22.5" cy="182.5" r="2.5" fill="#1CF7C3" />
        <circle cx="57.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="34.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="68.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="45.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="201.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="216.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="250.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="227.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="262.5" cy="27.5" r="2.5" fill="#1CF7C3" />
        <circle cx="239.5" cy="27.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="38.5" r="2.5" fill="#1CF7C3" />
        <circle cx="189.5" cy="38.5" r="2.5" fill="#151918" />
        <circle cx="166.5" cy="38.5" r="2.5" fill="#1CF7C3" />
        <circle cx="201.5" cy="38.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="38.5" r="2.5" fill="#1CF7C3" />
        <circle cx="154.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="49.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="201.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="49.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="201.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="216.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="250.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="227.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="262.5" cy="94.5" r="2.5" fill="#151918" />
        <circle cx="239.5" cy="94.5" r="2.5" fill="#1CF7C3" />
        <circle cx="154.5" cy="105.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="105.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="105.5" r="2.5" fill="#151918" />
        <circle cx="201.5" cy="105.5" r="2.5" fill="#1CF7C3" />
        <circle cx="178.5" cy="105.5" r="2.5" fill="#1CF7C3" />
        <circle cx="154.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="116.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="201.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="116.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="189.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="201.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="178.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="216.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="250.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="227.5" cy="160.5" r="2.5" fill="#1CF7C3" />
        <circle cx="262.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="239.5" cy="160.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="166.5" cy="171.5" r="2.5" fill="#1CF7C3" />
        <circle cx="201.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="171.5" r="2.5" fill="#151918" />
        <circle cx="154.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="189.5" cy="182.5" r="2.5" fill="#1CF7C3" />
        <circle cx="166.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="201.5" cy="182.5" r="2.5" fill="#151918" />
        <circle cx="178.5" cy="182.5" r="2.5" fill="#1CF7C3" />
      </svg>
    </>
  )
}

export default DeployGlobally
