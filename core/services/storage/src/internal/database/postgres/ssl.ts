import { isIP } from 'node:net'
import fastDecodeURIComponent from 'fast-decode-uri-component'
import { ConnectionOptions, createSecureContext, SecureContext } from 'tls'

// A SecureContext encapsulates only the CA trust anchor and crypto parameters,
// not the target host (SNI/servername and hostname verification stay
// per-connection tls.connect options). Passing a raw `ca` PEM string instead
// forces to re-parse the PEM and rebuild the X509 trust store on every TLS handshake.
// Build the context once and share it across all pools/connections.
// Keyed by cert string so this stays correct if differing certs are ever passed in.
const secureContextCache = new Map<string, SecureContext>()

function getSharedSecureContext(rootCert: string): SecureContext {
  let secureContext = secureContextCache.get(rootCert)
  if (!secureContext) {
    secureContext = createSecureContext({ ca: rootCert })
    secureContextCache.set(rootCert, secureContext)
  }
  return secureContext
}

const dontCheckServerIdentity = () => undefined

export function getSslSettings({
  connectionString,
  databaseSSLRootCert,
}: {
  connectionString: string
  databaseSSLRootCert: string | undefined
}): ConnectionOptions | undefined {
  if (!databaseSSLRootCert) return undefined

  const secureContext = getSharedSecureContext(databaseSSLRootCert)

  // When connecting through PGBouncer, we connect through an IPv6 address rather than a hostname.
  // When passing in the root CA for SSL, this will always fail,
  // so we need to skip verification if host name is an IP address.
  const hostname = getConnectionStringHostname(connectionString)
  if (hostname && isIpAddress(hostname)) {
    return {
      secureContext,
      rejectUnauthorized: false,
      checkServerIdentity: dontCheckServerIdentity,
    }
  }

  return { secureContext }
}

export function isIpAddress(ip: string) {
  const decoded = fastDecodeURIComponent(ip) ?? ip

  if (decoded.startsWith('[') && decoded.endsWith(']')) {
    return isIP(decoded.slice(1, -1)) !== 0
  }

  return isIP(decoded) !== 0
}

function getConnectionStringHostname(connectionString: string): string | undefined {
  const protocolSeparatorIndex = connectionString.indexOf('://')
  if (protocolSeparatorIndex === -1) {
    return undefined
  }

  const authorityStartIndex = protocolSeparatorIndex + 3
  let authorityEndIndex = connectionString.length

  for (let index = authorityStartIndex; index < connectionString.length; index++) {
    const charCode = connectionString.charCodeAt(index)
    if (charCode === 47 /* / */ || charCode === 63 /* ? */ || charCode === 35 /* # */) {
      authorityEndIndex = index
      break
    }
  }

  if (authorityStartIndex >= authorityEndIndex) {
    return undefined
  }

  let hostStartIndex = authorityStartIndex
  for (let index = authorityEndIndex - 1; index >= authorityStartIndex; index--) {
    if (connectionString.charCodeAt(index) === 64 /* @ */) {
      hostStartIndex = index + 1
      break
    }
  }

  if (hostStartIndex >= authorityEndIndex) {
    return undefined
  }

  if (connectionString.charCodeAt(hostStartIndex) === 91 /* [ */) {
    const bracketEndIndex = connectionString.indexOf(']', hostStartIndex + 1)

    if (
      bracketEndIndex === -1 ||
      bracketEndIndex >= authorityEndIndex ||
      (bracketEndIndex + 1 < authorityEndIndex &&
        connectionString.charCodeAt(bracketEndIndex + 1) !== 58) /* : */
    ) {
      return undefined
    }

    return connectionString.slice(hostStartIndex + 1, bracketEndIndex)
  }

  let hostEndIndex = authorityEndIndex
  for (let index = hostStartIndex; index < authorityEndIndex; index++) {
    if (connectionString.charCodeAt(index) === 58 /* : */) {
      hostEndIndex = index
      break
    }
  }

  if (hostStartIndex >= hostEndIndex) {
    return undefined
  }

  return connectionString.slice(hostStartIndex, hostEndIndex)
}
