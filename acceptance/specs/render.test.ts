import {
  describeAcceptance,
  encodePathSegments,
  getAcceptanceConfig,
  joinUrl,
} from '../support/config'
import { createAcceptanceHeaders, createRestClient } from '../support/http'
import {
  cleanupRestResources,
  createRestBucket,
  requireServiceKey,
  uniqueBucketName,
  uniqueObjectKey,
  uploadRestObject,
} from '../support/resources'

interface SignedUrlResponse {
  signedURL: string
}

const onePixelPng = new Uint8Array(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p94AAAAASUVORK5CYII=',
    'base64'
  )
)
// Minimal ftypmif1 HEIF-family header without heic/avif compatible brands. imgproxy
// v3.26 identifies it as HEIF-like, then rejects it as incompatible with heic/avif.
const incompatibleMif1Heif = new Uint8Array(Buffer.from('00000010667479706d69663100000000', 'hex'))

describeAcceptance(
  'image rendering contract',
  {
    destructive: true,
    profiles: ['full'],
    requires: ['render'],
  },
  () => {
    it('renders public, authenticated, and signed images with and without focal-point gravity', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('render')
      const objectKey = uniqueObjectKey('render', 'png')

      try {
        await createRestBucket(bucketName, { isPublic: true })
        await uploadRestObject(bucketName, objectKey, onePixelPng, {
          contentType: 'image/png',
        })

        await expectRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/public/${bucketName}/${encodePathSegments(objectKey)}?width=1&height=1`
          )
        )

        await expectRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/public/${bucketName}/${encodePathSegments(
              objectKey
            )}?width=1&height=1&format=webp`
          ),
          undefined,
          'image/webp'
        )

        await expectRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/authenticated/${bucketName}/${encodePathSegments(objectKey)}?width=1&height=1`
          ),
          token
        )

        const plainSigned = await client.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            body: {
              expiresIn: 60,
              transform: {
                height: 1,
                width: 1,
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        const plainSignedPath = plainSigned.json?.signedURL ?? ''
        const plainSignedUrl = new URL(joinUrl(config.baseUrl, plainSignedPath))
        const plainSignedToken = plainSignedUrl.searchParams.get('token')
        expect(plainSignedToken).toBeTruthy()

        const plainSignedRendered = await expectRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/sign/${bucketName}/${encodePathSegments(objectKey)}?token=${encodeURIComponent(
              plainSignedToken ?? ''
            )}`
          )
        )
        expect(plainSignedRendered.transformations ?? '').not.toContain('gravity:')

        const focalPointSigned = await client.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            body: {
              expiresIn: 60,
              transform: {
                gravity: 'fp',
                height: 1,
                resize: 'cover',
                width: 1,
                x_offset: 0,
                y_offset: 1,
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        const focalPointSignedUrl = new URL(
          joinUrl(config.baseUrl, focalPointSigned.json?.signedURL ?? '')
        )
        const focalPointSignedToken = focalPointSignedUrl.searchParams.get('token')
        expect(focalPointSignedToken).toBeTruthy()

        const signedRendered = await expectRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/sign/${bucketName}/${encodePathSegments(objectKey)}?token=${encodeURIComponent(
              focalPointSignedToken ?? ''
            )}`
          )
        )
        expect(signedRendered.transformations).toContain('gravity:fp:0:1')
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })

    it('returns bad request for no-transform imgproxy source-image validation failures', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const bucketName = uniqueBucketName('render-invalid-heif')
      const objectKey = uniqueObjectKey('render-invalid-heif', 'heic')

      try {
        await createRestBucket(bucketName, { isPublic: true })
        await uploadRestObject(bucketName, objectKey, incompatibleMif1Heif, {
          contentType: 'image/heic',
        })

        const rendered = await fetchRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/public/${bucketName}/${encodePathSegments(objectKey)}`
          )
        )

        expect(rendered.status, rendered.bodyText).toBe(400)
        expect(rendered.contentType).not.toMatch(/^image\//)
        expect(JSON.parse(rendered.bodyText)).toMatchObject({
          error: 'InvalidRequest',
          message: 'The source image is invalid or unsupported for rendering',
          statusCode: '400',
        })
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })

    it('rejects non-image input and invalid transformations', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const bucketName = uniqueBucketName('render-errors')
      const objectKey = uniqueObjectKey('render-text', 'txt')

      try {
        await createRestBucket(bucketName, { isPublic: true })
        await uploadRestObject(bucketName, objectKey, 'not an image', {
          contentType: 'text/plain',
        })

        const invalidTransform = await fetchRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/public/${bucketName}/${encodePathSegments(objectKey)}?width=-1`
          )
        )
        expect(invalidTransform.status).toBe(400)
        expect(invalidTransform.contentType).not.toMatch(/^image\//)
        expect(invalidTransform.bodyText).toContain('width')

        const nonImage = await fetchRenderedImage(
          joinUrl(
            config.baseUrl,
            `/render/image/public/${bucketName}/${encodePathSegments(objectKey)}?width=1&height=1`
          )
        )
        expect([400, 415, 422]).toContain(nonImage.status)
        expect(nonImage.contentType).not.toMatch(/^image\//)
        expect(nonImage.bodyText.length).toBeGreaterThan(0)
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })
  }
)

async function expectRenderedImage(url: string, token?: string, expectedContentType?: string) {
  const rendered = await fetchRenderedImage(url, token)
  const failureBody = rendered.contentType.startsWith('image/') ? '' : rendered.bodyText

  expect(rendered.status, failureBody).toBe(200)
  if (expectedContentType) {
    expect(rendered.contentType, failureBody).toBe(expectedContentType)
  } else {
    expect(rendered.contentType, failureBody).toMatch(/^image\//)
  }
  expect(rendered.body.byteLength, failureBody).toBeGreaterThan(0)
  return rendered
}

async function fetchRenderedImage(url: string, token?: string) {
  let response: Response | undefined
  try {
    response = await fetch(url, {
      headers: createAcceptanceHeaders(
        token
          ? {
              authorization: `Bearer ${token}`,
            }
          : undefined
      ),
    })

    const contentType = response.headers.get('content-type') ?? ''
    const body = await response.arrayBuffer()
    const bodyText = /^image\//.test(contentType) ? '' : new TextDecoder().decode(body)

    return {
      body,
      bodyText,
      contentType,
      status: response.status,
      transformations: response.headers.get('x-transformations'),
    }
  } finally {
    if (response && !response.bodyUsed) {
      await response.body?.cancel()
    }
  }
}
