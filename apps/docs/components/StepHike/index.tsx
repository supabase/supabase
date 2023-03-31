import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { StepHikeContext } from './StepHikeContext'

const StepHike = ({ children, title }) => {
  const [activeStep, setActiveStep] = useState(undefined)

  // check if there are any children
  if (!children) throw 'StepHike component requires <StepHike.Step> children'

  const steps = children.filter((x) => {
    return x.type.name === 'Step'
  })

  useEffect(() => {
    setActiveStep({
      titleId: steps[0].props.title.replaceAll(' ', '-').toLowerCase(),
      step: 0,
    })
  }, [])

  // check if there is at least 1 StepHike subcomponent
  if (steps.length === 0 || !steps)
    throw 'StepHike component needs at least 1 <StepHike.Step> child'

  // console.log('length of the steps filter', steps.length)

  return (
    <div className="">
      {/* <div
        className="
          sticky w-full top-[96px] z-50 p-5 rounded-lg
      flex gap-3 items-center
      bg-white-1200 dark:bg-scale-200
      border-t border-l border-r border-scale-600
      h-[60px]
      not-prose
     rounded-bl-none
     rounded-br-none
     shadow-md
     -mb-1.5
      "
      >
        <h3 className="text-scale-1200 text-xl">{title}</h3>
        <div className="justify-end grow flex gap-3">
          <Button type="default" onClick={() => handlePrev()} disabled={activeStep?.step === 0}>
            Prev
          </Button>
          <Button
            type="default"
            onClick={() => handleNext()}
            disabled={steps.length - 1 === activeStep?.step}
          >
            Next
          </Button>
        </div>
      </div> */}

      {/* <div
        className="sticky w-full top-[128px] bottom-[64px] z-10 p-5 rounded-lg

      flex gap-3 items-center
      backdrop-blur-lg backdrop-filter bg-white-1200 dark:bg-whiteA-300

      h-[60px]
      not-prose
      "
      >
        <div className="flex items-center gap-6">
          <div className="border bg-scale-600 border-scale-700 flex w-7 h-7 items-center justify-center rounded text-base text-scale-1200 font-semibold font-mono">
            {activeStep?.step + 1}
          </div>
          <h3 className="text-scale-1200 text-xl">
            {steps[activeStep?.step] && steps[activeStep?.step].props.title}
          </h3>
          <span className="font-mono uppercase text-xs">
            Step {activeStep?.step + 1} of {steps?.length}
          </span>
        </div>
        <div className="justify-end grow flex gap-3">
          <Button type="default" onClick={() => handlePrev()} disabled={activeStep?.step === 0}>
            Prev
          </Button>
          <Button
            type="default"
            onClick={() => handleNext()}
            disabled={steps.length - 1 === activeStep?.step}
          >
            Next
          </Button>
        </div>
      </div> */}
      <StepHikeContext.Provider value={{ activeStep, steps }}>{children}</StepHikeContext.Provider>
    </div>
  )
}

const Step = ({ children, title, step }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
  }, [])

  const ChildrenRender = ({ active }) => <div className="pl-[74px]">{children}</div>

  // const ref = useRef<HTMLDivElement | null>(null)

  // useEffect(() => {
  //   const cachedRef = ref.current
  //   const observer = new IntersectionObserver(
  //     ([e]) =>
  //       // setStuck(e.intersectionRatio < 1)
  //       console.log('scroll', title),
  //     {
  //       threshold: [0],
  //       rootMargin: '0px 0px 0px 0px',
  //     }
  //   )

  //   // const cachedRef: HTMLDivElement | null
  //   // Argument of type 'HTMLDivElement | null' is not assignable to parameter of type 'Element'.
  //   // Type 'null' is not assignable to type 'Element'.ts(2345)
  //   observer.observe(cachedRef)
  //   return () => observer.unobserve(cachedRef)
  // }, [ref])

  const { ref } = useInView({
    rootMargin: '10px 20px 30px 40px',
    threshold: 1,
    onChange: (inView, entry) => {
      if (window.scrollY === 0) console.log('out of view', title)
      if (inView) console.log('in view', title) // highlightSelectedTocItem(entry.target.id)
    },
  })

  return (
    <>
      <StepHikeContext.Consumer>
        {({ activeStep, steps }) => {
          // console.log('activeStep', activeStep)
          const cleanTitleId = title.replaceAll(' ', '-').toLowerCase()
          const active = cleanTitleId === activeStep?.titleId

          // useEffect(() => {}, [])

          return (
            <div>
              {/* <div className="h-[2px] w-full bg-scale-500"></div> */}
              <div
                ref={ref}
                className="sticky w-full top-[64px] z-10 p-5 rounded-lg

      flex gap-3 items-center
      backdrop-blur-lg backdrop-filter bg-white-1200 dark:bg-whiteA-300


      border-b border-l border-r border-scale-600 border-t

      h-[60px]
      not-prose
      shadow-md
      "
              >
                <div className="flex items-center gap-6">
                  <div className="border bg-scale-600 border-scale-700 flex w-7 h-7 items-center justify-center rounded text-base text-scale-1200 font-semibold font-mono">
                    {step}
                  </div>
                  <h3 className="text-scale-1200 text-xl" id={cleanTitleId}>
                    {title}
                  </h3>
                  <span className="font-mono uppercase text-xs">
                    Step {step} of {steps?.length}
                  </span>
                </div>
              </div>
              <ChildrenRender active={active} />
            </div>
          )
        }}
      </StepHikeContext.Consumer>
    </>
  )
}

StepHike.Step = Step
export default StepHike
