import { describe, expect, it } from 'vitest'

import { applyBucketIdToTemplateDefinition, createPayloadsForAddPolicy } from './Storage.utils'

describe('applyBucketIdToTemplateDefinition', () => {
  it('substitutes the bucket name as a SQL string literal', () => {
    expect(applyBucketIdToTemplateDefinition('bucket_id = {bucket_id}', 'avatars')).toBe(
      "bucket_id = 'avatars'"
    )
  })

  it('keeps the rest of the template intact', () => {
    expect(
      applyBucketIdToTemplateDefinition(
        "bucket_id = {bucket_id} AND (storage.foldername(name))[1] = 'private'",
        'avatars'
      )
    ).toBe("bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'private'")
  })

  it('escapes single quotes in the bucket name', () => {
    expect(applyBucketIdToTemplateDefinition('bucket_id = {bucket_id}', "bob's files")).toBe(
      "bucket_id = 'bob''s files'"
    )
  })

  it('does not treat $ sequences in the bucket name as replacement patterns', () => {
    expect(applyBucketIdToTemplateDefinition('bucket_id = {bucket_id}', 'a$&b')).toBe(
      "bucket_id = 'a$&b'"
    )
    expect(applyBucketIdToTemplateDefinition('bucket_id = {bucket_id}', "a$'b")).toBe(
      "bucket_id = 'a$''b'"
    )
  })
})

describe('createPayloadsForAddPolicy', () => {
  it('produces a valid definition for a bucket name containing a single quote', () => {
    const definition = applyBucketIdToTemplateDefinition('bucket_id = {bucket_id}', "bob's files")
    const [payload] = createPayloadsForAddPolicy(
      "bob's files",
      {
        name: 'Read',
        schema: 'storage',
        table: 'objects',
        command: null,
        check: null,
        definition,
        allowedOperations: ['SELECT'],
        roles: [],
      },
      false
    )
    expect(payload.definition).toBe("(bucket_id = 'bob''s files')")
  })
})
