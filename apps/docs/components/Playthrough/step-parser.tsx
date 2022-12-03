import React from 'react'
import { Chapter, Step } from './Chapter'

export function childrenToSteps(children) {
  const kids = React.Children.toArray(children) as any[]

  let chapterCount = 0
  let steps = []
  const newChildren = kids.map((child) => {
    if (child.props.mdxType === 'Chapter') {
      const chapterIndex = chapterCount++
      const startAtIndex = steps.length
      const children = React.Children.toArray(child.props.children).map((child: any) => {
        if (child?.props?.mdxType === 'Step') {
          const solution = getSolutionFromStepElement(child)
          const stepIndex = steps.length
          const { show, title, intro } = child.props
          steps.push({ chapterIndex, stepIndex, solution, intro, show: () => show })
          return (
            <Step stepIndex={stepIndex} title={title} key={stepIndex}>
              {child.props.children}
            </Step>
          )
        }
        return child
      })
      const endAtIndex = steps.length
      return (
        <Chapter
          key={chapterIndex}
          chapterIndex={chapterIndex}
          title={child.props.title}
          startAtIndex={startAtIndex}
          chapterStepCount={endAtIndex - startAtIndex}
        >
          {children}
        </Chapter>
      )
    }
    return child
  })
  return { children: newChildren, steps }
}

function getSolutionFromStepElement(stepElement) {
  // find the first code element if any
  const preElement = stepElement.props?.children?.find((c: any) => c?.props?.mdxType === 'pre')
  const solveCodeElement = preElement?.props?.children

  // if there is a solve=command in the metastring
  if (solveCodeElement?.props?.solve === 'command') {
    const command = solveCodeElement.props?.children
    return [{ command: command.trim() }]
  }

  // if there is a solve=command in the metastring
  if (solveCodeElement?.props?.solve === 'running') {
    const command = solveCodeElement.props?.children
    return [{ command: command.trim(), onRunning: true }]
  }

  // if there is a solve=file in the metastring
  if (solveCodeElement?.props?.solve === 'file') {
    const contents = solveCodeElement.props?.children
    // we get the path from the title prop
    const path = solveCodeElement.props?.title
    return [{ path, contents }]
  }

  return undefined
}
