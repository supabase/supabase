http.get(`${API_URL}/platform/projects/${PROJECT_REF}/analytics/endpoints/logs.error`, () => {
  return HttpResponse.json({
    result: [
      {
        event_message:
          'HEAD | 200 | 104.28.198.19 | 883a5c4dbde074e0 | https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/ | supabase-api/local',
        metadata: [
          {
            load_balancer_redirect_identifier: null,
            logflare_worker: [
              {
                worker_id: '3HGVWX',
              },
            ],
            request: [
              {
                cf: [
                  {
                    asOrganization: 'Cloudflare Warp',
                    asn: 13335,
                    botManagement: [
                      {
                        corporateProxy: false,
                        detectionIds: [],
                        ja3Hash: null,
                        jsDetection: [
                          {
                            passed: false,
                          },
                        ],
                        score: 99,
                        staticResource: false,
                        verifiedBot: false,
                      },
                    ],
                    city: 'Palma',
                    clientAcceptEncoding: 'br, gzip, deflate',
                    clientTcpRtt: null,
                    clientTrustScore: null,
                    colo: 'MAD',
                    continent: 'EU',
                    country: 'ES',
                    edgeRequestKeepAliveStatus: 1,
                    httpProtocol: 'HTTP/1.1',
                    isEUCountry: '1',
                    latitude: '39.56610',
                    longitude: '2.64870',
                    metroCode: null,
                    postalCode: '07122',
                    region: 'Balearic Islands',
                    regionCode: 'IB',
                    requestPriority: null,
                    timezone: 'Europe/Madrid',
                    tlsCipher: 'AEAD-AES256-GCM-SHA384',
                    tlsClientAuth: [
                      {
                        certPresented: '0',
                        certRevoked: '0',
                        certVerified: 'NONE',
                      },
                    ],
                    tlsClientExtensionsSha1: 'GWeb1cCR2UBICwtIDbeP9YjL/PU=',
                    tlsClientHelloLength: '668',
                    tlsClientRandom: 'nZFXIBZMLgu/aebI0xFSMWwlJPVvba8FHLQk8lz6XmU=',
                    tlsExportedAuthenticator: [
                      {
                        clientFinished:
                          '1ed0c269e7963fad0f57dd68f9f332547a939abe3c8e58892e8a64e50570ff1420e7856dbca8bf4f9da79cfe13fdd3b7',
                        clientHandshake:
                          '257c99abe5310b9fedab5100efd40e406b44867ddbb12f23c9ae25b848ac60f4f7d1d50e636b57fb4113228acbbe6249',
                        serverFinished:
                          '6398f5256f49d94542f302ac1f066f45a8abd4add31063a8ac8d8c05e79c58834dee463c6aa62791a512e9f947b2b99e',
                        serverHandshake:
                          '4906aecd5014f768ad9b0a8c853d2ff85b5f2b0179ceb349253ee0c206dd8ccd4456e3e46eb6f2085586a66cf8f4e4e7',
                      },
                    ],
                    tlsVersion: 'TLSv1.3',
                    verifiedBotCategory: null,
                  },
                ],
                headers: [
                  {
                    accept: 'application/json',
                    apikey: null,
                    cf_connecting_ip: '104.28.198.19',
                    cf_ipcountry: 'ES',
                    cf_ray: '883a5c4dbde074e0',
                    content_length: null,
                    content_type: 'application/json',
                    host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                    prefer: null,
                    range: null,
                    referer: null,
                    user_agent: 'supabase-api/local',
                    x_client_info: null,
                    x_forwarded_proto: 'https',
                    x_real_ip: '104.28.198.19',
                  },
                ],
                host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                method: 'HEAD',
                path: '/rest/v1/',
                port: null,
                protocol: 'https:',
                sb: [],
                search: null,
                url: 'https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/',
              },
            ],
            response: [
              {
                headers: [
                  {
                    cf_cache_status: 'DYNAMIC',
                    cf_ray: '883a5c4df1b574e0-MAD',
                    content_length: null,
                    content_location: null,
                    content_range: null,
                    content_type: 'application/openapi+json; charset=utf-8',
                    date: 'Tue, 14 May 2024 10:56:15 GMT',
                    sb_gateway_mode: null,
                    sb_gateway_version: '1',
                    transfer_encoding: null,
                    x_kong_proxy_latency: '5',
                    x_kong_upstream_latency: '2',
                  },
                ],
                origin_time: 822,
                status_code: 200,
              },
            ],
          },
        ],
        timestamp: '2024-05-14T10:56:15.832000',
      },
      {
        event_message:
          'GET | 200 | 104.28.198.19 | 883a5c4dbdda74e0 | https://ysahjioqwmcuhrzlblsu.supabase.red/auth/v1/health | supabase-api/local',
        metadata: [
          {
            load_balancer_redirect_identifier: null,
            logflare_worker: [
              {
                worker_id: '3HGVWX',
              },
            ],
            request: [
              {
                cf: [
                  {
                    asOrganization: 'Cloudflare Warp',
                    asn: 13335,
                    botManagement: [
                      {
                        corporateProxy: false,
                        detectionIds: [],
                        ja3Hash: null,
                        jsDetection: [
                          {
                            passed: false,
                          },
                        ],
                        score: 99,
                        staticResource: false,
                        verifiedBot: false,
                      },
                    ],
                    city: 'Palma',
                    clientAcceptEncoding: 'br, gzip, deflate',
                    clientTcpRtt: null,
                    clientTrustScore: null,
                    colo: 'MAD',
                    continent: 'EU',
                    country: 'ES',
                    edgeRequestKeepAliveStatus: 1,
                    httpProtocol: 'HTTP/1.1',
                    isEUCountry: '1',
                    latitude: '39.56610',
                    longitude: '2.64870',
                    metroCode: null,
                    postalCode: '07122',
                    region: 'Balearic Islands',
                    regionCode: 'IB',
                    requestPriority: null,
                    timezone: 'Europe/Madrid',
                    tlsCipher: 'AEAD-AES256-GCM-SHA384',
                    tlsClientAuth: [
                      {
                        certPresented: '0',
                        certRevoked: '0',
                        certVerified: 'NONE',
                      },
                    ],
                    tlsClientExtensionsSha1: 'GWeb1cCR2UBICwtIDbeP9YjL/PU=',
                    tlsClientHelloLength: '668',
                    tlsClientRandom: 'rB5UIu+/3xP1BC6xRzJpqteqitzhm6QjfgbFzW8nzM8=',
                    tlsExportedAuthenticator: [
                      {
                        clientFinished:
                          '849b148b7ec4daeef5285d7c780dcdbe8b02abceb494e42e55282410ce8beaea2c50038417baca925d35c2ed14871763',
                        clientHandshake:
                          '500450b7f85ebc01c583c41e58fac12fa980ad8585c992c10b3d85b4fb5c8e369ff10468b569b672d8ee1a2f4635f810',
                        serverFinished:
                          '3d94992a0e8f3ce5c2b45c77dcfa10909aa059f2d3cc74e354f6bd57790ca75dcd54117fbc5993f401136c9b9dfe1d52',
                        serverHandshake:
                          '5985775dce4357678e7d40a33171208ad70bfbc711defa69f8267425072c43a0971ab1898a9f2908352355250dcaf36d',
                      },
                    ],
                    tlsVersion: 'TLSv1.3',
                    verifiedBotCategory: null,
                  },
                ],
                headers: [
                  {
                    accept: 'application/json',
                    apikey: null,
                    cf_connecting_ip: '104.28.198.19',
                    cf_ipcountry: 'ES',
                    cf_ray: '883a5c4dbdda74e0',
                    content_length: null,
                    content_type: 'application/json',
                    host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                    prefer: null,
                    range: null,
                    referer: null,
                    user_agent: 'supabase-api/local',
                    x_client_info: null,
                    x_forwarded_proto: 'https',
                    x_real_ip: '104.28.198.19',
                  },
                ],
                host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                method: 'GET',
                path: '/auth/v1/health',
                port: null,
                protocol: 'https:',
                sb: [],
                search: null,
                url: 'https://ysahjioqwmcuhrzlblsu.supabase.red/auth/v1/health',
              },
            ],
            response: [
              {
                headers: [
                  {
                    cf_cache_status: 'DYNAMIC',
                    cf_ray: '883a5c4df1af74e0-MAD',
                    content_length: '111',
                    content_location: null,
                    content_range: null,
                    content_type: 'application/json',
                    date: 'Tue, 14 May 2024 10:56:15 GMT',
                    sb_gateway_mode: null,
                    sb_gateway_version: '1',
                    transfer_encoding: null,
                    x_kong_proxy_latency: '1',
                    x_kong_upstream_latency: '1',
                  },
                ],
                origin_time: 295,
                status_code: 200,
              },
            ],
          },
        ],
        timestamp: '2024-05-14T10:56:15.300000',
      },
      {
        event_message:
          'GET | 200 | 104.28.198.19 | 883a5c3ffdd974e0 | https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/ | supabase-api/local',
        metadata: [
          {
            load_balancer_redirect_identifier: null,
            logflare_worker: [
              {
                worker_id: '3HGVWX',
              },
            ],
            request: [
              {
                cf: [
                  {
                    asOrganization: 'Cloudflare Warp',
                    asn: 13335,
                    botManagement: [
                      {
                        corporateProxy: false,
                        detectionIds: [],
                        ja3Hash: null,
                        jsDetection: [
                          {
                            passed: false,
                          },
                        ],
                        score: 99,
                        staticResource: false,
                        verifiedBot: false,
                      },
                    ],
                    city: 'Palma',
                    clientAcceptEncoding: 'br, gzip, deflate',
                    clientTcpRtt: null,
                    clientTrustScore: null,
                    colo: 'MAD',
                    continent: 'EU',
                    country: 'ES',
                    edgeRequestKeepAliveStatus: 1,
                    httpProtocol: 'HTTP/1.1',
                    isEUCountry: '1',
                    latitude: '39.56610',
                    longitude: '2.64870',
                    metroCode: null,
                    postalCode: '07122',
                    region: 'Balearic Islands',
                    regionCode: 'IB',
                    requestPriority: null,
                    timezone: 'Europe/Madrid',
                    tlsCipher: 'AEAD-AES256-GCM-SHA384',
                    tlsClientAuth: [
                      {
                        certPresented: '0',
                        certRevoked: '0',
                        certVerified: 'NONE',
                      },
                    ],
                    tlsClientExtensionsSha1: 'GWeb1cCR2UBICwtIDbeP9YjL/PU=',
                    tlsClientHelloLength: '668',
                    tlsClientRandom: 'rB5UIu+/3xP1BC6xRzJpqteqitzhm6QjfgbFzW8nzM8=',
                    tlsExportedAuthenticator: [
                      {
                        clientFinished:
                          '849b148b7ec4daeef5285d7c780dcdbe8b02abceb494e42e55282410ce8beaea2c50038417baca925d35c2ed14871763',
                        clientHandshake:
                          '500450b7f85ebc01c583c41e58fac12fa980ad8585c992c10b3d85b4fb5c8e369ff10468b569b672d8ee1a2f4635f810',
                        serverFinished:
                          '3d94992a0e8f3ce5c2b45c77dcfa10909aa059f2d3cc74e354f6bd57790ca75dcd54117fbc5993f401136c9b9dfe1d52',
                        serverHandshake:
                          '5985775dce4357678e7d40a33171208ad70bfbc711defa69f8267425072c43a0971ab1898a9f2908352355250dcaf36d',
                      },
                    ],
                    tlsVersion: 'TLSv1.3',
                    verifiedBotCategory: null,
                  },
                ],
                headers: [
                  {
                    accept: 'application/json',
                    apikey: null,
                    cf_connecting_ip: '104.28.198.19',
                    cf_ipcountry: 'ES',
                    cf_ray: '883a5c3ffdd974e0',
                    content_length: null,
                    content_type: 'application/json',
                    host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                    prefer: null,
                    range: null,
                    referer: null,
                    user_agent: 'supabase-api/local',
                    x_client_info: null,
                    x_forwarded_proto: 'https',
                    x_real_ip: '104.28.198.19',
                  },
                ],
                host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                method: 'GET',
                path: '/rest/v1/',
                port: null,
                protocol: 'https:',
                sb: [],
                search: null,
                url: 'https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/',
              },
            ],
            response: [
              {
                headers: [
                  {
                    cf_cache_status: 'DYNAMIC',
                    cf_ray: '883a5c40a2aa74e0-MAD',
                    content_length: null,
                    content_location: null,
                    content_range: null,
                    content_type: 'application/openapi+json; charset=utf-8',
                    date: 'Tue, 14 May 2024 10:56:14 GMT',
                    sb_gateway_mode: null,
                    sb_gateway_version: '1',
                    transfer_encoding: 'chunked',
                    x_kong_proxy_latency: '1',
                    x_kong_upstream_latency: '13',
                  },
                ],
                origin_time: 1902,
                status_code: 200,
              },
            ],
          },
        ],
        timestamp: '2024-05-14T10:56:14.720000',
      },
      {
        event_message:
          'GET | 200 | 104.28.198.19 | 883a5c3ffddb74e0 | https://ysahjioqwmcuhrzlblsu.supabase.red/auth/v1/health | supabase-api/local',
        metadata: [
          {
            load_balancer_redirect_identifier: null,
            logflare_worker: [
              {
                worker_id: '3HGVWX',
              },
            ],
            request: [
              {
                cf: [
                  {
                    asOrganization: 'Cloudflare Warp',
                    asn: 13335,
                    botManagement: [
                      {
                        corporateProxy: false,
                        detectionIds: [],
                        ja3Hash: null,
                        jsDetection: [
                          {
                            passed: false,
                          },
                        ],
                        score: 99,
                        staticResource: false,
                        verifiedBot: false,
                      },
                    ],
                    city: 'Palma',
                    clientAcceptEncoding: 'br, gzip, deflate',
                    clientTcpRtt: null,
                    clientTrustScore: null,
                    colo: 'MAD',
                    continent: 'EU',
                    country: 'ES',
                    edgeRequestKeepAliveStatus: 1,
                    httpProtocol: 'HTTP/1.1',
                    isEUCountry: '1',
                    latitude: '39.56610',
                    longitude: '2.64870',
                    metroCode: null,
                    postalCode: '07122',
                    region: 'Balearic Islands',
                    regionCode: 'IB',
                    requestPriority: null,
                    timezone: 'Europe/Madrid',
                    tlsCipher: 'AEAD-AES256-GCM-SHA384',
                    tlsClientAuth: [
                      {
                        certPresented: '0',
                        certRevoked: '0',
                        certVerified: 'NONE',
                      },
                    ],
                    tlsClientExtensionsSha1: 'GWeb1cCR2UBICwtIDbeP9YjL/PU=',
                    tlsClientHelloLength: '668',
                    tlsClientRandom: 'nZFXIBZMLgu/aebI0xFSMWwlJPVvba8FHLQk8lz6XmU=',
                    tlsExportedAuthenticator: [
                      {
                        clientFinished:
                          '1ed0c269e7963fad0f57dd68f9f332547a939abe3c8e58892e8a64e50570ff1420e7856dbca8bf4f9da79cfe13fdd3b7',
                        clientHandshake:
                          '257c99abe5310b9fedab5100efd40e406b44867ddbb12f23c9ae25b848ac60f4f7d1d50e636b57fb4113228acbbe6249',
                        serverFinished:
                          '6398f5256f49d94542f302ac1f066f45a8abd4add31063a8ac8d8c05e79c58834dee463c6aa62791a512e9f947b2b99e',
                        serverHandshake:
                          '4906aecd5014f768ad9b0a8c853d2ff85b5f2b0179ceb349253ee0c206dd8ccd4456e3e46eb6f2085586a66cf8f4e4e7',
                      },
                    ],
                    tlsVersion: 'TLSv1.3',
                    verifiedBotCategory: null,
                  },
                ],
                headers: [
                  {
                    accept: 'application/json',
                    apikey: null,
                    cf_connecting_ip: '104.28.198.19',
                    cf_ipcountry: 'ES',
                    cf_ray: '883a5c3ffddb74e0',
                    content_length: null,
                    content_type: 'application/json',
                    host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                    prefer: null,
                    range: null,
                    referer: null,
                    user_agent: 'supabase-api/local',
                    x_client_info: null,
                    x_forwarded_proto: 'https',
                    x_real_ip: '104.28.198.19',
                  },
                ],
                host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                method: 'GET',
                path: '/auth/v1/health',
                port: null,
                protocol: 'https:',
                sb: [],
                search: null,
                url: 'https://ysahjioqwmcuhrzlblsu.supabase.red/auth/v1/health',
              },
            ],
            response: [
              {
                headers: [
                  {
                    cf_cache_status: 'DYNAMIC',
                    cf_ray: '883a5c40829d74e0-MAD',
                    content_length: '111',
                    content_location: null,
                    content_range: null,
                    content_type: 'application/json',
                    date: 'Tue, 14 May 2024 10:56:13 GMT',
                    sb_gateway_mode: null,
                    sb_gateway_version: '1',
                    transfer_encoding: null,
                    x_kong_proxy_latency: '1',
                    x_kong_upstream_latency: '1',
                  },
                ],
                origin_time: 869,
                status_code: 200,
              },
            ],
          },
        ],
        timestamp: '2024-05-14T10:56:13.677000',
      },
      {
        event_message:
          'GET | 200 | 104.28.198.19 | 883a4457597074e0 | https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/ | supabase-api/local',
        metadata: [
          {
            load_balancer_redirect_identifier: null,
            logflare_worker: [
              {
                worker_id: '3HGVWX',
              },
            ],
            request: [
              {
                cf: [
                  {
                    asOrganization: 'Cloudflare Warp',
                    asn: 13335,
                    botManagement: [
                      {
                        corporateProxy: false,
                        detectionIds: [],
                        ja3Hash: null,
                        jsDetection: [
                          {
                            passed: false,
                          },
                        ],
                        score: 99,
                        staticResource: false,
                        verifiedBot: false,
                      },
                    ],
                    city: 'Palma',
                    clientAcceptEncoding: 'br, gzip, deflate',
                    clientTcpRtt: null,
                    clientTrustScore: null,
                    colo: 'MAD',
                    continent: 'EU',
                    country: 'ES',
                    edgeRequestKeepAliveStatus: 1,
                    httpProtocol: 'HTTP/1.1',
                    isEUCountry: '1',
                    latitude: '39.56610',
                    longitude: '2.64870',
                    metroCode: null,
                    postalCode: '07122',
                    region: 'Balearic Islands',
                    regionCode: 'IB',
                    requestPriority: null,
                    timezone: 'Europe/Madrid',
                    tlsCipher: 'AEAD-AES256-GCM-SHA384',
                    tlsClientAuth: [
                      {
                        certPresented: '0',
                        certRevoked: '0',
                        certVerified: 'NONE',
                      },
                    ],
                    tlsClientExtensionsSha1: 'GWeb1cCR2UBICwtIDbeP9YjL/PU=',
                    tlsClientHelloLength: '668',
                    tlsClientRandom: 'qkwLCWa5AOzn+e04pYAENCqWae0Ad0BxZTeZ2ZlPf6c=',
                    tlsExportedAuthenticator: [
                      {
                        clientFinished:
                          'dc697fa4294793fa81192020faed82061ebea299d11f342d3c250958e2edb1e5611d503c340c618f4123aaa4be0b634e',
                        clientHandshake:
                          'b054ab2562f96b698d82cced25a75cbd57a62838ad7a585d3dba9e5221cefbb66c4b02058385e79f21e89b900854d340',
                        serverFinished:
                          '6f9d3190c49485ebfb8bf4126fe19f5c472acdd21a433d1edfbd6efc068b444bfea50888ebcc6a2975d6866c06d39569',
                        serverHandshake:
                          '41ebc706fe15e04c4f7c33226bea0f4eb0440991840bff3a1787d82e63b74af22bb3926ab6593300490d94ef0ca84ac3',
                      },
                    ],
                    tlsVersion: 'TLSv1.3',
                    verifiedBotCategory: null,
                  },
                ],
                headers: [
                  {
                    accept: 'application/json',
                    apikey: null,
                    cf_connecting_ip: '104.28.198.19',
                    cf_ipcountry: 'ES',
                    cf_ray: '883a4457597074e0',
                    content_length: null,
                    content_type: 'application/json',
                    host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                    prefer: null,
                    range: null,
                    referer: null,
                    user_agent: 'supabase-api/local',
                    x_client_info: null,
                    x_forwarded_proto: 'https',
                    x_real_ip: '104.28.198.19',
                  },
                ],
                host: 'ysahjioqwmcuhrzlblsu.supabase.red',
                method: 'GET',
                path: '/rest/v1/',
                port: null,
                protocol: 'https:',
                sb: [],
                search: null,
                url: 'https://ysahjioqwmcuhrzlblsu.supabase.red/rest/v1/',
              },
            ],
            response: [
              {
                headers: [
                  {
                    cf_cache_status: 'DYNAMIC',
                    cf_ray: '883a445807de74e0-MAD',
                    content_length: null,
                    content_location: null,
                    content_range: null,
                    content_type: 'application/openapi+json; charset=utf-8',
                    date: 'Tue, 14 May 2024 10:39:54 GMT',
                    sb_gateway_mode: null,
                    sb_gateway_version: '1',
                    transfer_encoding: 'chunked',
                    x_kong_proxy_latency: '0',
                    x_kong_upstream_latency: '11',
                  },
                ],
                origin_time: 920,
                status_code: 200,
              },
            ],
          },
        ],
        timestamp: '2024-05-14T10:39:54.420000',
      },
    ],
    error: null,
  })
})
