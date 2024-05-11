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

  return (
    <div>
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
          const cleanTitleId = title.replaceAll(' ', '-').toLowerCase()
          const active = cleanTitleId === activeStep?.titleId

          return (
            <div>
              <div
                ref={ref}
                className="sticky w-full top-[64px] z-10 p-5 rounded-lg

      flex gap-3 items-center
      backdrop-blur-lg backdrop-filter bg-background


      border-b border-l border-r border-control border-t

      h-[60px]
      not-prose
      shadow-md
      "
              >
                <div className="flex items-center gap-6">
                  <div className="border bg-selection border-strong flex w-7 h-7 items-center justify-center rounded text-base text-foreground font-semibold font-mono">
                    {step}
                  </div>
                  <h3 className="text-foreground text-xl" id={cleanTitleId}>
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
