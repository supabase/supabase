import fastify, { FastifyInstance } from 'fastify'
import {
  lifecycleConfigurationToS3,
  normalizeLifecycleConfiguration,
  normalizeS3LifecycleConfiguration,
} from '../../storage/lifecycle/configuration'
import { s3ErrorHandler } from '../routes/s3/error-handler'
import { escapeXmlAttribute, insertRootNamespace, xmlParser } from './xml'

const multipartArrayPaths = ['CompleteMultipartUpload.Part']

async function buildXmlApp(
  parseAsArray: string[] = [],
  responseNamespace?: string,
  onAcceptsCall?: () => void
): Promise<FastifyInstance> {
  const app = fastify()

  await app.register(xmlParser, { parseAsArray, responseNamespace })

  if (onAcceptsCall) {
    app.addHook('onRequest', (request, _reply, done) => {
      const originalAccepts = request.accepts.bind(request)
      request.accepts = () => {
        onAcceptsCall()
        return originalAccepts()
      }
      done()
    })
  }

  app.post('/xml', async (req) => {
    return { body: req.body }
  })

  app.put('/lifecycle', async (req) => req.body)

  app.get('/xml', async () => {
    return {
      ListBucketResult: {
        Name: 'test-bucket',
        Empty: '',
        IsTruncated: false,
        Size: 0,
        Skipped: [],
        Optional: undefined,
        Timestamp: new Date('2026-07-16T00:00:00.000Z'),
        Value: { _: 'text', $: { kind: 'true' } },
        Text: `'"&<>\r\0`,
        Attribute: { _: 'text', $: { special: `'"&<>\r\n\t\0` } },
        Contents: [{ Key: 'first' }, { Key: 'second' }],
      },
    }
  })

  app.get('/xml/multi-root', async () => {
    return { ETag: 'etag', LastModified: 'now' }
  })

  app.get('/xml/empty', async () => {
    return {}
  })

  app.get('/xml/undefined-root', async () => {
    return { Root: undefined }
  })

  app.get('/xml/empty-array-root', async () => {
    return { Root: [] }
  })

  app.get('/xml/repeated-root', async () => {
    return { Root: [1, 2] }
  })

  app.get('/xml/null-root', async () => {
    return { Root: null }
  })

  app.get('/xml/invalid-root', async () => {
    return { 'bad root': 'value' }
  })

  return app
}

describe('xmlParser plugin', () => {
  it('preserves valid lifecycle ID characters through S3 serialization and parsing', async () => {
    const configuration = normalizeLifecycleConfiguration({
      rules: [
        {
          id: 'before\t\n\r😀after',
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 30 },
        },
      ],
    })
    const app = fastify()
    await app.register(xmlParser, {
      parseAsArray: ['LifecycleConfiguration.Rule'],
      responseNamespace: 'http://s3.amazonaws.com/doc/2006-03-01/',
    })
    app.get('/lifecycle', async () => lifecycleConfigurationToS3(configuration))
    app.put('/lifecycle', async (request) => ({
      Configuration: normalizeS3LifecycleConfiguration(request.body),
    }))

    try {
      const serialized = await app.inject({ method: 'GET', url: '/lifecycle' })
      expect(serialized.statusCode).toBe(200)
      const parsed = await app.inject({
        method: 'PUT',
        url: '/lifecycle',
        headers: { 'content-type': 'application/xml', accept: 'application/json' },
        payload: serialized.body,
      })
      expect(parsed.statusCode).toBe(200)
      expect(parsed.json()).toEqual({ Configuration: configuration })
    } finally {
      await app.close()
    }
  })

  it('round-trips lifecycle rules with the S3 namespace and repeated Rule elements', async () => {
    const app = await buildXmlApp(
      ['LifecycleConfiguration.Rule'],
      'http://s3.amazonaws.com/doc/2006-03-01/'
    )

    try {
      const payload =
        '<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Rule><ID>first</ID><Status>Enabled</Status><Filter/><NoncurrentVersionExpiration><NoncurrentDays>30</NoncurrentDays><NewerNoncurrentVersions>2</NewerNoncurrentVersions></NoncurrentVersionExpiration></Rule><Rule><ID>second</ID><Status>Disabled</Status><Filter/><NoncurrentVersionExpiration><NoncurrentDays>7</NoncurrentDays></NoncurrentVersionExpiration></Rule></LifecycleConfiguration>'
      const response = await app.inject({
        method: 'PUT',
        url: '/lifecycle',
        headers: { 'content-type': 'application/xml', accept: 'application/xml' },
        payload,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain('<LifecycleConfiguration')
      expect(response.body.match(/<Rule>/g)).toHaveLength(2)
      expect(response.body).toContain('<NewerNoncurrentVersions>2</NewerNoncurrentVersions>')
      expect(response.body).toContain('xmlns="http://s3.amazonaws.com/doc/2006-03-01/"')
    } finally {
      await app.close()
    }
  })

  it.each([
    'application/xml',
    'text/xml',
  ])('parses %s bodies and enforces configured array paths', async (contentType) => {
    const app = await buildXmlApp(multipartArrayPaths)

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': contentType,
          accept: 'application/json',
        },
        payload:
          '<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag-1</ETag></Part></CompleteMultipartUpload>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          CompleteMultipartUpload: {
            Part: [{ PartNumber: '1', ETag: 'etag-1' }],
          },
        },
      })
    } finally {
      await app.close()
    }
  })

  it('parses an empty XML body as null', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload: '',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ body: null })
    } finally {
      await app.close()
    }
  })

  it('ignores the XML declaration while preserving the root namespace', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload:
          '<?xml version="1.0" encoding="UTF-8"?><Root xmlns="urn:test"><Value>1</Value></Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          Root: {
            Value: '1',
            $: { xmlns: 'urn:test' },
          },
        },
      })
    } finally {
      await app.close()
    }
  })

  it.each([
    ['without an XML declaration', '\uFEFF<Root><Value>ok</Value></Root>'],
    [
      'with an XML declaration',
      '\uFEFF<?xml version="1.0" encoding="UTF-8"?><Root><Value>ok</Value></Root>',
    ],
  ])('parses BOM-prefixed XML bodies %s', async (_description, payload) => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ body: { Root: { Value: 'ok' } } })
    } finally {
      await app.close()
    }
  })

  it('preserves XML attributes, text nodes, repeated elements, and scalar text', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload:
          '<Root><Value kind="example">text</Value><EscapedAttribute named="&amp;" numeric="&#x26;"/><Item>1</Item><Item>2</Item><Exponent>1e3</Exponent><Hex>0x1F</Hex><LeadingZeros>007</LeadingZeros><Huge>12345678901234567890</Huge><UnsafeInteger>9007199254740992</UnsafeInteger><Float> 1.5 </Float><Enabled>FALSE</Enabled><Astral>😀</Astral><Entities>&amp;&lt;&gt;&quot;&apos;</Entities><Numeric>&#48;&#x31;</Numeric><EscapedNumeric>&amp;#48;</EscapedNumeric><Pi>p<?pi?>iab</Pi><Empty/></Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          Root: {
            Value: { _: 'text', $: { kind: 'example' } },
            EscapedAttribute: { $: { named: '&', numeric: '&' } },
            Item: ['1', '2'],
            Exponent: '1e3',
            Hex: '0x1F',
            LeadingZeros: '007',
            Huge: '12345678901234567890',
            UnsafeInteger: '9007199254740992',
            Float: ' 1.5 ',
            Enabled: 'FALSE',
            Astral: '😀',
            Entities: `&<>"'`,
            Numeric: '01',
            EscapedNumeric: '&#48;',
            Pi: 'piab',
            Empty: '',
          },
        },
      })
    } finally {
      await app.close()
    }
  })

  it('ignores PI-like text inside comments and preserves it inside CDATA', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload: '<Root><!-- <?pi x="&bogus;"?> --><![CDATA[<?pi x="&bogus;"?>]]></Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ body: { Root: '<?pi x="&bogus;"?>' } })
    } finally {
      await app.close()
    }
  })

  it('preserves leaf whitespace while dropping non-leaf formatting whitespace', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload:
          '<Root>\n  <!-- <!DOCTYPE Root> -->\n  <Blank>   </Blank>\n  <MultilineBlank>\n    \n  </MultilineBlank>\n  <Cdata><![CDATA[   ]]></Cdata>\n  <CommentLikeCdata><![CDATA[<!DOCTYPE Root><!-- bad -- comment -->]]></CommentLikeCdata>\n  <Padded>  a b  </Padded>\n  <Attributed kind="  example  ">   </Attributed>\n  <Container>\n    <Child>value</Child>\n  </Container>\n</Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          Root: {
            Blank: '   ',
            MultilineBlank: '\n    \n  ',
            Cdata: '   ',
            CommentLikeCdata: '<!DOCTYPE Root><!-- bad -- comment -->',
            Padded: '  a b  ',
            Attributed: { _: '   ', $: { kind: '  example  ' } },
            Container: { Child: 'value' },
          },
        },
      })
    } finally {
      await app.close()
    }
  })

  it('drops space and tab formatting whitespace from parent elements', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload: '<Root> <A>1</A>\t<B>2</B> </Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          Root: { A: '1', B: '2' },
        },
      })
    } finally {
      await app.close()
    }
  })

  it('preserves non-whitespace mixed content', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload: '<Root>text <A>1</A></Root>',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        body: {
          Root: { A: '1', _: 'text ' },
        },
      })
    } finally {
      await app.close()
    }
  })

  it.each([
    ['mismatched tags', '<CompleteMultipartUpload><Part></CompleteMultipartUpload>'],
    ['multiple roots', '<First/><Root/>'],
    ['repeated roots', '<Root/><Root/>'],
    ['DOCTYPE declarations', '<!DOCTYPE Root><Root/>'],
    ['custom entities', '<!DOCTYPE Root [<!ENTITY value "expanded">]><Root>&value;</Root>'],
    [
      'external entities',
      '<!DOCTYPE Root [<!ENTITY value SYSTEM "file:///etc/passwd">]><Root>&value;</Root>',
    ],
    ['undeclared entities', '<Root>&bogus;</Root>'],
    ['unescaped ampersands in attributes', '<Delete xmlns="urn:a&b"/>'],
    ['unterminated comments', '<Root><!-- data</Root>'],
    ['unterminated CDATA', '<Root><![CDATA[data</Root>'],
    ['unterminated processing instructions', '<Root><?pi data</Root>'],
    ['null references', '<Root>&#0;</Root>'],
    ['surrogate references', '<Root>&#xD800;</Root>'],
    ['noncharacter references', '<Root>&#xFFFF;</Root>'],
    ['out-of-range references', '<Root>&#x110000;</Root>'],
    ['malformed numeric references', '<Root>&#x;</Root>'],
    ['raw invalid characters', '<Root>\0</Root>'],
  ])('returns 400 for unsupported or malformed XML payloads with %s', async (_case, payload) => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe('MalformedXML')
      expect(response.json().message).toContain('Invalid XML payload')
    } finally {
      await app.close()
    }
  })

  it('does not scan entity references across unescaped ampersands', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/xml',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/json',
        },
        payload: '<Root value="&bare&amp;"/>',
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe('MalformedXML')
      expect(response.json().message).toBe('Invalid XML payload: Unescaped ampersand')
    } finally {
      await app.close()
    }
  })

  it('bounds XML nesting depth', async () => {
    const app = await buildXmlApp()
    const parse = (payload: string) =>
      app.inject({
        method: 'POST',
        url: '/xml',
        headers: { 'content-type': 'application/xml', accept: 'application/json' },
        payload,
      })

    try {
      const nestedDocument = (depth: number) =>
        `${'<Node>'.repeat(depth)}value${'</Node>'.repeat(depth)}`
      expect((await parse(nestedDocument(100))).statusCode).toBe(200)
      expect((await parse(nestedDocument(101))).statusCode).toBe(200)
      expect((await parse(nestedDocument(102))).statusCode).toBe(400)
    } finally {
      await app.close()
    }
  })

  it('serializes response payloads as XML when requested', async () => {
    const app = await buildXmlApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/xml',
        headers: {
          accept: 'application/xml',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/xml')
      expect(response.payload).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><ListBucketResult><Name>test-bucket</Name><Empty/><IsTruncated>false</IsTruncated><Size>0</Size><Timestamp>2026-07-16T00:00:00.000Z</Timestamp><Value kind="true">text</Value><Text>\'"&amp;&lt;&gt;&#xD;�</Text><Attribute special="&apos;&quot;&amp;&lt;&gt;&#xD;&#xA;&#x9;�">text</Attribute><Contents><Key>first</Key></Contents><Contents><Key>second</Key></Contents></ListBucketResult>'
      )
    } finally {
      await app.close()
    }
  })

  it('rejects payloads that cannot form a single-rooted XML document', async () => {
    const app = await buildXmlApp()

    try {
      for (const url of [
        '/xml/multi-root',
        '/xml/empty',
        '/xml/undefined-root',
        '/xml/empty-array-root',
        '/xml/repeated-root',
        '/xml/invalid-root',
      ]) {
        const response = await app.inject({
          method: 'GET',
          url,
          headers: {
            accept: 'application/xml',
          },
        })

        expect(response.statusCode).toBe(500)
      }

      const nullRootResponse = await app.inject({
        method: 'GET',
        url: '/xml/null-root',
        headers: {
          accept: 'application/xml',
        },
      })

      expect(nullRootResponse.statusCode).toBe(200)
      expect(nullRootResponse.payload).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Root/>'
      )
    } finally {
      await app.close()
    }
  })

  it.each([
    ['a missing Accept header', undefined, 'application/xml', 0],
    ['a wildcard Accept header', '*/*', 'application/xml', 0],
    ['an explicit XML Accept header', 'application/xml', 'application/xml', 0],
    ['an explicit text XML Accept header', 'text/xml', 'application/xml', 0],
    ['an explicit HTML Accept header', 'text/html', 'application/xml', 0],
    ['a case-variant XML Accept header', 'Application/XML', 'application/xml', 0],
    ['a padded XML Accept header', '  Application/XML  ', 'application/xml', 0],
    [
      'a multi-value Accept header',
      'application/json, application/xml;q=0.9',
      'application/xml',
      1,
    ],
    ['an explicit JSON Accept header', 'application/json', 'application/json', 1],
    ['an excluded XML media type', 'application/xml;q=0', 'application/json', 1],
  ])('negotiates %s', async (_case, accept, expectedContentType, expectedAcceptsCalls) => {
    let acceptsCalls = 0
    const app = await buildXmlApp([], undefined, () => acceptsCalls++)

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/xml',
        headers: accept === undefined ? undefined : { accept },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain(expectedContentType)
      expect(acceptsCalls).toBe(expectedAcceptsCalls)
    } finally {
      await app.close()
    }
  })

  it('serializes response guard failures through the S3 XML error handler', async () => {
    const app = fastify()

    await app.register(xmlParser)
    app.setErrorHandler(s3ErrorHandler)
    app.get('/xml', async () => ({ First: 'one', Second: 'two' }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/xml',
        headers: {
          accept: 'application/xml',
        },
      })

      expect(response.statusCode).toBe(500)
      expect(response.headers['content-type']).toContain('application/xml')
      expect(response.payload).toContain('<Error>')
      expect(response.payload).toContain('<Code>InternalError</Code>')
      expect(response.payload).toContain(
        '<Message>XML response payload must be an object with a single root element</Message>'
      )
    } finally {
      await app.close()
    }
  })

  it('adds the configured namespace to the response root', async () => {
    const app = await buildXmlApp([], 'http://s3.amazonaws.com/doc/2006-03-01/')

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/xml',
        headers: {
          accept: 'application/xml',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain(
        '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
          '<Name>test-bucket</Name><Empty/>'
      )
    } finally {
      await app.close()
    }
  })
})

describe('insertRootNamespace', () => {
  const nsAttr = ' xmlns="http://s3.amazonaws.com/doc/2006-03-01/"'
  const decl = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

  it('inserts into a plain root tag', () => {
    expect(
      insertRootNamespace(`${decl}<ListBucketResult><Name>b</Name></ListBucketResult>`, nsAttr)
    ).toBe(`${decl}<ListBucketResult${nsAttr}><Name>b</Name></ListBucketResult>`)
  })

  it('inserts into a scalar-valued root tag', () => {
    expect(
      insertRootNamespace(`${decl}<LocationConstraint>us-east-1</LocationConstraint>`, nsAttr)
    ).toBe(`${decl}<LocationConstraint${nsAttr}>us-east-1</LocationConstraint>`)
  })

  it('inserts before the slash of a self-closing root tag', () => {
    expect(insertRootNamespace(`${decl}<LocationConstraint/>`, nsAttr)).toBe(
      `${decl}<LocationConstraint${nsAttr}/>`
    )
  })

  it('does not duplicate an existing xmlns attribute', () => {
    const xml = `${decl}<DeleteResult xmlns="urn:other"><Deleted/></DeleteResult>`
    expect(insertRootNamespace(xml, nsAttr)).toBe(xml)
  })

  it('ignores > inside quoted attribute values', () => {
    expect(insertRootNamespace(`${decl}<Root note="x > y"><A/></Root>`, nsAttr)).toBe(
      `${decl}<Root note="x > y"${nsAttr}><A/></Root>`
    )
  })

  it('ignores xmlns= inside quoted attribute values', () => {
    expect(insertRootNamespace(`${decl}<Root note=" xmlns=not-an-attr"><A/></Root>`, nsAttr)).toBe(
      `${decl}<Root note=" xmlns=not-an-attr"${nsAttr}><A/></Root>`
    )
  })

  it('does not match prefixed namespace declarations', () => {
    expect(insertRootNamespace(`${decl}<Root xmlns:x="urn:x"><A/></Root>`, nsAttr)).toBe(
      `${decl}<Root xmlns:x="urn:x"${nsAttr}><A/></Root>`
    )
  })
})

describe('escapeXmlAttribute', () => {
  it('escapes attribute-special characters', () => {
    expect(escapeXmlAttribute('a&b"c<d>e')).toBe('a&amp;b&quot;c&lt;d&gt;e')
  })
})
