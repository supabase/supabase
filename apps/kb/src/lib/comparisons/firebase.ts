import type { CompetitorProfile } from './types'

export const firebase = {
  name: 'Firebase',
  last_verified: '2026-11-02',
  deployment: {
    license: {
      value: { tier: 'closed', spdx_id: null },
      notes:
        'The hosted service is not published as open source, and no primary license statement for it was found. The client SDKs are Apache-2.0 (see open_source_scope).',
      sourcing_urls: [
        'https://firebase.google.com/docs/emulator-suite',
        'https://github.com/firebase/firebase-js-sdk/blob/main/LICENSE',
      ],
    },
    open_source_scope: {
      value: ['client_sdks'],
      notes:
        'The JavaScript SDK repository is Apache-2.0. Protobuf, which it depends on, is BSD-3-Clause. The server side is not open.',
      sourcing_urls: ['https://github.com/firebase/firebase-js-sdk/blob/main/LICENSE'],
    },
    self_host: {
      value: 'none',
      notes:
        'The Emulator Suite runs locally for development and testing. Its docs say not to use it as a self-hosted version of Firebase, and it is not suited to production.',
      sourcing_urls: ['https://firebase.google.com/docs/emulator-suite'],
    },
  },
  portability: {
    wire_protocol: {
      value: ['proprietary'],
      notes:
        'Cloud Firestore is accessed through language SDKs. The data-model docs describe no SQL or standard wire interface, so this rests on that SDK-only documentation.',
      sourcing_urls: ['https://firebase.google.com/docs/firestore/data-model'],
    },
    query_model: {
      value: 'document',
      notes:
        'Cloud Firestore is a NoSQL document database with collections, documents, and subcollections. It has no tables or rows.',
      sourcing_urls: ['https://firebase.google.com/docs/firestore/data-model'],
    },
    upstream_projects: {
      value: [],
      notes: 'No upstream open-source project for the hosted service was identified.',
      sourcing_urls: [],
    },
    export_tool: {
      value: 'gcloud firestore export',
      sourcing_urls: ['https://firebase.google.com/docs/firestore/manage-data/export-import'],
    },
    export_format: {
      value: 'leveldb',
      notes: 'Exports go to a Cloud Storage bucket in LevelDB log format, with protobuf metadata.',
      sourcing_urls: ['https://firebase.google.com/docs/firestore/manage-data/export-import'],
    },
    loads_into_standard_server: {
      value: false,
      notes:
        'LevelDB logs are not a SQL dump, so a standard Postgres or MySQL server can’t load them directly.',
      sourcing_urls: ['https://firebase.google.com/docs/firestore/manage-data/export-import'],
    },
  },
} satisfies CompetitorProfile
