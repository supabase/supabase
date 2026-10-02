// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

import { TextDecoder } from "ext:deno_web/08_text_encoding.js";
import { Buffer } from "node:buffer";

/**
 * @typedef {import('../_global.d.ts').ReadableStream
 * } ReadableStream
 * @typedef {import('../_stream.d.ts')} Readable
 */

/**
 * @param {AsyncIterable|ReadableStream|Readable} stream
 * @returns {Promise<Blob>}
 */
async function blob(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return new Blob(chunks);
}

/**
 * @param {AsyncIterable|ReadableStream|Readable} stream
 * @returns {Promise<ArrayBuffer>}
 */
async function arrayBuffer(stream) {
  const ret = await blob(stream);
  return ret.arrayBuffer();
}

/**
 * @param {AsyncIterable|ReadableStream|Readable} stream
 * @returns {Promise<Buffer>}
 */
async function buffer(stream) {
  return Buffer.from(await arrayBuffer(stream));
}

/**
 * @param {AsyncIterable|ReadableStream|Readable} stream
 * @returns {Promise<string>}
 */
async function text(stream) {
  const dec = new TextDecoder();
  let str = "";
  for await (const chunk of stream) {
    if (typeof chunk === "string") {
      str += chunk;
    } else {
      str += dec.decode(chunk, { stream: true });
    }
  }
  // Flush the streaming TextDecoder so that any pending
  // incomplete multibyte characters are handled.
  str += dec.decode(undefined, { stream: false });
  return str;
}

/**
 * @param {AsyncIterable|ReadableStream|Readable} stream
 * @returns {Promise<any>}
 */
async function json(stream) {
  const str = await text(stream);
  return JSON.parse(str);
}

export default {
  arrayBuffer,
  blob,
  buffer,
  json,
  text,
};
export { arrayBuffer, blob, buffer, json, text };
