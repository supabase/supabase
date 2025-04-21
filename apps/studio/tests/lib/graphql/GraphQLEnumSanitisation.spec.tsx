

import * as path from 'path';
import * as dotenv from 'dotenv';
import { test, expect } from '@playwright/test';
import { sanitizeEnumNames } from '../../../lib/graphql/sanitizeIntrospection';

dotenv.config({
  // ─┬ go up: graphql → lib → tests → studio → apps → supabase
  //  │                                   └──────────────┬────────────┐
  //  └───────────────────────────────────────────────────┴───────────▼───────────┐
  path: path.resolve(__dirname, '../../../../../docker/.env'), // ← supabase/docker/.env
});


const GRAPHQL_URL =
  process.env.GRAPHQL_URL || 'http://127.0.0.1:8000/graphql/v1';

const ANON_KEY =
  process.env.ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!ANON_KEY) {
  throw new Error(
    'SUPABASE_ANON_KEY (or ANON_KEY) not found – check docker/.env',
  );
}


test.describe('pg_graphql enum sanitisation', () => {
  test('all enum names are [_A‑Za‑z0‑9] after sanitiseEnumNames()', async ({
    request,
  }) => {
    const introspectionQuery = `
      { __schema { types { kind enumValues { name } } } }
    `;

    const res = await request.post(GRAPHQL_URL, {
      headers: {
        'content-type': 'application/json',
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
      },
      data: { query: introspectionQuery },
    });

    expect(
      res.ok(),
      `Cannot reach pg_graphql at ${GRAPHQL_URL} (status ${res.status()})`,
    ).toBeTruthy();

    const cleaned = sanitizeEnumNames(await res.json());

    const illegal: string[] = [];
    cleaned.data.__schema.types?.forEach((t: any) => {
      if (t.kind === 'ENUM') {
        t.enumValues?.forEach((v: any) => {
          if (/[^_A-Za-z0-9]/.test(v.name)) illegal.push(v.name);
        });
      }
    });

    expect(
      illegal,
      `Unsanitised enum values returned → ${illegal.join(', ')}`,
    ).toHaveLength(0);
  });
});
