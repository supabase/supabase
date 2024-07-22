/// <reference types="@testing-library/jest-dom" />

import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'

expect.extend(matchers)

vi.mock('next/navigation', () => require('next-router-mock'))

afterEach(() => {
  cleanup()
})
