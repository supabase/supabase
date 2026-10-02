import { Hash } from '@smithy/hash-node'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'

interface RawSignatureV4Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  service: string
}

export function createRawSignatureV4Signer(
  credentials: RawSignatureV4Credentials,
  options: {
    hostname?: string
    method?: string
  } = {}
) {
  const hostname = options.hostname ?? 'storage.test'
  const method = options.method ?? 'HEAD'
  const signer = new SignatureV4({
    credentials,
    region: credentials.region,
    service: credentials.service,
    sha256: Hash.bind(null, 'sha256'),
    uriEscapePath: false,
  })

  return (path: string) =>
    signer.sign(
      new HttpRequest({
        protocol: 'http:',
        hostname,
        method,
        path,
        query: {},
        headers: {
          host: hostname,
        },
      })
    )
}
