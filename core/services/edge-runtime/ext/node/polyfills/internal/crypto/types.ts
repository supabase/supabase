// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { BufferEncoding } from "ext:deno_node/_global.d.ts";
import { Buffer } from "../../buffer.ts";

export type HASH_DATA = string | ArrayBufferView | Buffer | ArrayBuffer;

export type BinaryToTextEncoding = "base64" | "base64url" | "hex" | "binary";

export type CharacterEncoding = "utf8" | "utf-8" | "utf16le" | "latin1";

export type LegacyCharacterEncoding = "ascii" | "binary" | "ucs2" | "ucs-2";

export type Encoding =
  | BinaryToTextEncoding
  | CharacterEncoding
  | LegacyCharacterEncoding;

export type ECDHKeyFormat = "compressed" | "uncompressed";

export type BinaryLike = string | ArrayBufferView;

export type KeyFormat = "pem" | "der";

export type KeyType =
  | "rsa"
  | "rsa-pss"
  | "dsa"
  | "ec"
  | "ed25519"
  | "ed448"
  | "x25519"
  | "x448";

export interface PrivateKeyInput {
  key: string | Buffer;
  encoding: BufferEncoding | "buffer";
  format?: KeyFormat | undefined;
  type?: "pkcs1" | "pkcs8" | "sec1" | undefined;
  passphrase?: string | Buffer | undefined;
}

export interface PublicKeyInput {
  key: string | Buffer;
  encoding: BufferEncoding | "buffer";
  format?: KeyFormat | undefined;
  type?: "pkcs1" | "spki" | undefined;
}
