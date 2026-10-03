import accepts from '@fastify/accepts'
import { ERRORS } from '@internal/errors'
import { hasInvalidXmlCharacters } from '@internal/xml'
import Builder from 'fast-xml-builder'
import { XMLParser } from 'fast-xml-parser'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

type XmlParserOptions = {
  disableContentParser?: boolean
  parseAsArray?: string[]
  responseNamespace?: string
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*$/
const XML_ENTITY_REFERENCE = /&([^;&]*);|&/g
const XML_NUMERIC_ENTITY = /^#(?:x([\dA-F]+)|(\d+))$/i
const XML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
}
const XML_CHARACTER_RANGE = String.raw`\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}`
const XML_ESCAPED_CHARACTER = new RegExp(`[&<>\\t\\n\\r]|[^${XML_CHARACTER_RANGE}]`, 'gu')
const HAS_XML_ESCAPED_CHARACTER = new RegExp(XML_ESCAPED_CHARACTER.source, 'u')
const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '\t': '&#x9;',
  '\n': '&#xA;',
  '\r': '&#xD;',
}

const escapeXmlValue = (value: unknown, attribute: boolean) => {
  const string = typeof value === 'string' ? value : String(value)
  if (!HAS_XML_ESCAPED_CHARACTER.test(string)) return string

  return string.replace(XML_ESCAPED_CHARACTER, (character) =>
    !attribute && (character === '\t' || character === '\n')
      ? character
      : (XML_ESCAPES[character] ?? '\uFFFD')
  )
}
const serializeXmlText = (_tagName: string, value: unknown) =>
  escapeXmlValue(value instanceof Date ? value.toISOString() : value, false)
const serializeXmlAttribute = (_name: string, value: unknown) => escapeXmlValue(value, true)

// Escapes a string for use inside a double-quoted XML attribute value.
export function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Inserts a precomputed ` xmlns="..."` attribute into the root tag of an
 * already-built XML document. The scan is quote-aware and stops at the end of
 * the opening root tag, so its cost is independent from the response body size.
 */
export function insertRootNamespace(xmlPayload: string, namespaceAttribute: string): string {
  const declarationEnd = xmlPayload.indexOf('?>')
  const rootStart = declarationEnd === -1 ? 0 : declarationEnd + 2

  let quote = 0
  for (let index = rootStart; index < xmlPayload.length; index++) {
    const character = xmlPayload.charCodeAt(index)
    if (quote !== 0) {
      if (character === quote) {
        quote = 0
      }
      continue
    }

    if (character === 34 || character === 39) {
      quote = character
      continue
    }

    if (character === 32 && xmlPayload.startsWith('xmlns=', index + 1)) {
      return xmlPayload
    }

    if (character === 62) {
      const tagEnd = xmlPayload.charCodeAt(index - 1) === 47 ? index - 1 : index
      return xmlPayload.slice(0, tagEnd) + namespaceAttribute + xmlPayload.slice(tagEnd)
    }
  }

  return xmlPayload
}

function isValidXmlCodePoint(codePoint: number) {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  )
}

const xmlEntityDecoder = {
  setExternalEntities() {},
  addInputEntities() {
    throw new Error('DOCTYPE is not supported')
  },
  reset() {},
  setXmlVersion() {},
  decode(text: string) {
    if (text.indexOf('&') === -1) return text

    return text.replace(XML_ENTITY_REFERENCE, (_reference, entity: string | undefined) => {
      if (entity === undefined) throw new Error('Unescaped ampersand')

      if (Object.hasOwn(XML_ENTITIES, entity)) {
        return XML_ENTITIES[entity]
      }

      const match = XML_NUMERIC_ENTITY.exec(entity)
      const codePoint = match
        ? Number.parseInt(match[1] ?? match[2], match[1] === undefined ? 10 : 16)
        : Number.NaN

      if (!isValidXmlCodePoint(codePoint)) {
        const message = entity.startsWith('#')
          ? 'Invalid numeric character reference'
          : 'Undeclared XML entity'
        throw new Error(message)
      }

      return String.fromCodePoint(codePoint)
    })
  },
}

const xmlBuilder = new Builder({
  format: false,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  attributesGroupName: '$',
  textNodeName: '_',
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
  processEntities: false,
  tagValueProcessor: serializeXmlText,
  attributeValueProcessor: serializeXmlAttribute,
})

const acceptedTypes = ['application/xml', 'text/xml', 'text/html']
const buildXml = (payload: unknown) => XML_DECLARATION + xmlBuilder.build(payload)

function acceptsXmlResponse(req: FastifyRequest): boolean {
  const accept = req.headers.accept
  if (accept === undefined || accept === '*/*' || acceptedTypes.includes(accept)) {
    return true
  }

  const normalizedAccept = accept.trim().toLowerCase()
  if (
    normalizedAccept !== accept &&
    (normalizedAccept === '*/*' || acceptedTypes.includes(normalizedAccept))
  ) {
    return true
  }

  return req.accepts().types(acceptedTypes) !== false
}

function isXmlDocumentPayload(payload: unknown): payload is Record<string, unknown> {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return false
  }

  const rootKeys = Object.keys(payload)
  if (rootKeys.length !== 1 || !XML_NAME.test(rootKeys[0])) {
    return false
  }

  const rootValue = (payload as Record<string, unknown>)[rootKeys[0]]
  return rootValue !== undefined && !Array.isArray(rootValue)
}

export const xmlParser = fastifyPlugin(
  async function (fastify: FastifyInstance, opts: XmlParserOptions) {
    fastify.register(accepts)

    if (!opts.disableContentParser) {
      const arrayPaths = new Set(opts.parseAsArray?.filter(Boolean))
      const arrayTags = new Set(
        [...arrayPaths].map((path) => path.slice(path.lastIndexOf('.') + 1))
      )
      const parser = new XMLParser({
        ignoreDeclaration: true,
        ignoreAttributes: false,
        attributeNamePrefix: '',
        attributesGroupName: '$',
        textNodeName: '_',
        parseTagValue: false,
        trimValues: false,
        ignorePiTags: true,
        jPath: false,
        entityDecoder: xmlEntityDecoder,
        tagValueProcessor: (_tagName, value, _jPath, _hasAttributes, isLeafNode) =>
          !isLeafNode && value.trim() === '' ? '' : undefined,
        isArray: (tagName, path) => arrayTags.has(tagName) && arrayPaths.has(String(path)),
      })

      fastify.addContentTypeParser(
        ['text/xml', 'application/xml'],
        { parseAs: 'string' },
        (_request, body, done) => {
          if (!body) {
            done(null, null)
            return
          }

          try {
            const raw = body.toString()
            const xml = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
            if (hasInvalidXmlCharacters(xml)) {
              throw new Error('Invalid XML character')
            }
            const payload = parser.parse(xml, true)
            if (!isXmlDocumentPayload(payload)) {
              throw new Error('XML payload must contain a single root element')
            }
            done(null, payload)
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            done(
              Object.assign(ERRORS.MalformedXML(`Invalid XML payload: ${message}`), {
                statusCode: 400,
              })
            )
          }
        }
      )
    }

    const namespaceAttribute = opts.responseNamespace
      ? ` xmlns="${escapeXmlAttribute(opts.responseNamespace)}"`
      : undefined
    const serializeXml = namespaceAttribute
      ? (payload: unknown) => insertRootNamespace(buildXml(payload), namespaceAttribute)
      : buildXml

    fastify.addHook('preSerialization', (req, res, payload, done) => {
      if (acceptsXmlResponse(req)) {
        if (!isXmlDocumentPayload(payload)) {
          done(
            ERRORS.InternalError(
              undefined,
              'XML response payload must be an object with a single root element'
            )
          )
          return
        }

        res.header('content-type', 'application/xml; charset=utf-8')
        res.serializer(serializeXml)
      }

      done(null, payload)
    })
  },
  { name: 'xml-parser' }
)
