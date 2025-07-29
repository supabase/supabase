import { expect, test } from 'vitest'
import { SPECIAL_CHARS_REGEX } from './ProjectCreation.constants'

test('Regex test to surface if password contains @, : or /', () => {
  expect(!'teststring'.match(SPECIAL_CHARS_REGEX)).toEqual(false)
  expect(!'test@string'.match(SPECIAL_CHARS_REGEX)).toEqual(true)
  expect(!'te:ststring'.match(SPECIAL_CHARS_REGEX)).toEqual(true)
  expect(!`tests/tring`.match(SPECIAL_CHARS_REGEX)).toEqual(true)
  expect(!'!#$%^&*()'.match(SPECIAL_CHARS_REGEX)).toEqual(false)
})
