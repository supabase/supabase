import { t, nt, ot } from '../shared/test.js' // eslint-disable-line
import { Client, neonConfig } from "@neondatabase/serverless";
import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket;

const connectionString = `postgres://${encodeURIComponent(process.env.PGUSER)}:${encodeURIComponent(process.env.PGPASS)}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}${process.env.PGSSL ? '?ssl=true' : ''}`;

neonConfig.wsProxy = (_host, _port) => `127.0.0.1:4000/v2/`
neonConfig.useSecureWebSocket = false;
const client = new Client(connectionString);

t('Connect, run simple query, disconnect', async () => {
  await client.connect();
  const result = await client.query("SELECT 1 as one");
  await client.end();
  return [1, result.rows[0]["one"]];
});
