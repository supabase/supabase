# Testagram Storage Node

A user-owned computer can voluntarily expose approved local directories to Testagram.

## Security model

- The backend never receives an arbitrary filesystem path.
- The agent maps opaque root identifiers to local paths.
- The backend can only issue scoped operations against an approved root.
- Symlink components are rejected to prevent root escape.
- Node sessions are short-lived; the enrollment secret is stored only as a hash on the backend.
- The agent makes outbound HTTPS requests; no inbound public port is required.
- There is no shell/command execution operation.

## Enrollment

Create a pairing token from an authenticated Testagram client:

`POST /functions/v1/storage-node-gateway/pairings`

Then run:

`node src/index.mjs enroll --url https://YOUR-TESTAGRAM/functions/v1/storage-node-gateway --pairing-token tg_pair_... --device-name Studio-PC --platform windows --root videos=C:\\Testagram\\Videos`

The server returns a node secret once. Keep it in the node credential file.

## Run

`node src/index.mjs run --config ~/.testagram/storage-node.json`

The agent sends heartbeats and polls for scoped storage commands.

The first implementation intentionally limits inline read/write commands to 8 MiB. Large media transfer will use the next streaming protocol rather than base64-encoding multi-gigabyte recordings.
