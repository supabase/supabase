'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Course = 'foundations'
type CourseContextType = {
  course: Course
  setCourse: (course: Course) => void
}

const CourseContext = createContext<CourseContextType | undefined>(undefined)

export function FrameworkProvider({ children }: { children: React.ReactNode }) {
  const [course, setCourseState] = useState<Course>('foundations')

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    const storedCourse = localStorage.getItem('preferredCourse')
    const validCourses: Course[] = ['foundations']
    if (storedCourse && validCourses.includes(storedCourse as Course)) {
      setCourseState(storedCourse as Course)
    }
  }, [])

  // Update localStorage when course changes
  const setCourse = (newCourse: Course) => {
    setCourseState(newCourse)
    localStorage.setItem('preferredCourse', newCourse)
  }

  return <CourseContext.Provider value={{ course, setCourse }}>{children}</CourseContext.Provider>
}

// Custom hook to use the framework context
export function useCourse() {
  const context = useContext(CourseContext)
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider')
  }
  return context
}
