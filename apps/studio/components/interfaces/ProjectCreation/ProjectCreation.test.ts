import { expect, test } from 'vitest'
import { DATABASE_PASSWORD_REGEX } from './ProjectCreation.constants'

test('Regex test to surface if password contains @, : or /', () => {
  expect(!'teststring'.match(DATABASE_PASSWORD_REGEX)).toEqual(false)
  expect(!'test@string'.match(DATABASE_PASSWORD_REGEX)).toEqual(true)
  expect(!'te:ststring'.match(DATABASE_PASSWORD_REGEX)).toEqual(true)
  expect(!`tests/tring`.match(DATABASE_PASSWORD_REGEX)).toEqual(true)
  expect(!'!#$%^&*()'.match(DATABASE_PASSWORD_REGEX)).toEqual(false)
})
