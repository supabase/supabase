export const TRANSACTION_MODE_DESCRIPTION =
  'Connection is assigned to the client for the duration of a transaction. Some session-based Postgres features such as prepared statements are not available with this option.'

export const SESSION_MODE_DESCRIPTION =
  'When a new client connects, a connection is assigned to the client until it disconnects. All Postgres features can be used with this option.'
